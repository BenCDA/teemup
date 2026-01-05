package com.teemup.service;

import com.teemup.dto.auth.AuthResponse;
import com.teemup.dto.auth.LoginRequest;
import com.teemup.dto.auth.RefreshTokenRequest;
import com.teemup.dto.auth.RegisterRequest;
import com.teemup.dto.verification.FaceVerificationResponse;
import com.teemup.entity.User;
import com.teemup.exception.FaceVerificationException;
import com.teemup.repository.UserRepository;
import com.teemup.security.JwtService;
import com.teemup.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private FaceVerificationService faceVerificationService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = User.builder()
                .id(testUserId)
                .email("test@example.com")
                .password("encodedPassword")
                .firstName("John")
                .lastName("Doe")
                .provider(User.AuthProvider.LOCAL)
                .isActive(true)
                .isOnline(false)
                .isVerified(true)
                .build();
    }

    @Nested
    @DisplayName("Register Tests")
    class RegisterTests {

        @Test
        @DisplayName("Should register user successfully when email is new and face verification passes")
        void shouldRegisterUserSuccessfully() {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setEmail("new@example.com");
            request.setPassword("password123");
            request.setFirstName("Jane");
            request.setLastName("Doe");
            request.setVerificationImage("base64image");

            FaceVerificationResponse verificationResponse = FaceVerificationResponse.builder()
                    .faceDetected(true)
                    .isAdult(true)
                    .age(25)
                    .gender("female")
                    .genderConfidence(0.95)
                    .build();

            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(faceVerificationService.verifyFace(anyString())).thenReturn(verificationResponse);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(UUID.randomUUID());
                return user;
            });
            when(jwtService.generateToken(any(UserDetailsImpl.class), any(UUID.class))).thenReturn("accessToken");
            when(jwtService.generateRefreshToken(any(UserDetailsImpl.class), any(UUID.class))).thenReturn("refreshToken");
            when(jwtService.getJwtExpiration()).thenReturn(3600000L);

            // When
            AuthResponse response = authService.register(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("accessToken");
            assertThat(response.getRefreshToken()).isEqualTo("refreshToken");
            assertThat(response.getUser()).isNotNull();
            assertThat(response.getUser().getEmail()).isEqualTo("new@example.com");

            verify(userRepository).existsByEmail("new@example.com");
            verify(faceVerificationService).verifyFace("base64image");
            verify(userRepository, times(2)).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void shouldThrowExceptionWhenEmailExists() {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setEmail("existing@example.com");

            when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

            // When/Then
            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Email already exists");

            verify(userRepository).existsByEmail("existing@example.com");
            verify(faceVerificationService, never()).verifyFace(anyString());
        }

        @Test
        @DisplayName("Should throw exception when no face detected")
        void shouldThrowExceptionWhenNoFaceDetected() {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setEmail("new@example.com");
            request.setVerificationImage("base64image");

            FaceVerificationResponse verificationResponse = FaceVerificationResponse.builder()
                    .faceDetected(false)
                    .build();

            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(faceVerificationService.verifyFace(anyString())).thenReturn(verificationResponse);

            // When/Then
            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(FaceVerificationException.class)
                    .hasMessageContaining("Aucun visage");

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when user is not adult")
        void shouldThrowExceptionWhenUserNotAdult() {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setEmail("new@example.com");
            request.setVerificationImage("base64image");

            FaceVerificationResponse verificationResponse = FaceVerificationResponse.builder()
                    .faceDetected(true)
                    .isAdult(false)
                    .age(16)
                    .build();

            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(faceVerificationService.verifyFace(anyString())).thenReturn(verificationResponse);

            // When/Then
            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(FaceVerificationException.class)
                    .hasMessageContaining("18 ans");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login user successfully with valid credentials")
        void shouldLoginSuccessfully() {
            // Given
            LoginRequest request = new LoginRequest();
            request.setEmail("test@example.com");
            request.setPassword("password123");

            UserDetailsImpl userDetails = UserDetailsImpl.build(testUser);
            Authentication authentication = mock(Authentication.class);

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(authentication.getPrincipal()).thenReturn(userDetails);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(jwtService.generateToken(any(UserDetailsImpl.class), any(UUID.class))).thenReturn("accessToken");
            when(jwtService.generateRefreshToken(any(UserDetailsImpl.class), any(UUID.class))).thenReturn("refreshToken");
            when(jwtService.getJwtExpiration()).thenReturn(3600000L);
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // When
            AuthResponse response = authService.login(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("accessToken");
            assertThat(response.getRefreshToken()).isEqualTo("refreshToken");
            assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");

            verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
            verify(userRepository).findByEmail("test@example.com");
        }

        @Test
        @DisplayName("Should throw exception when credentials are invalid")
        void shouldThrowExceptionWhenCredentialsInvalid() {
            // Given
            LoginRequest request = new LoginRequest();
            request.setEmail("test@example.com");
            request.setPassword("wrongpassword");

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            // When/Then
            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class);

            verify(userRepository, never()).findByEmail(anyString());
        }
    }

    @Nested
    @DisplayName("Refresh Token Tests")
    class RefreshTokenTests {

        @Test
        @DisplayName("Should refresh token successfully with valid refresh token")
        void shouldRefreshTokenSuccessfully() {
            // Given
            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken("validRefreshToken");

            UserDetailsImpl userDetails = UserDetailsImpl.build(testUser);

            when(jwtService.extractUsernameFromRefreshToken("validRefreshToken")).thenReturn("test@example.com");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(jwtService.isRefreshTokenValid(eq("validRefreshToken"), any(UserDetailsImpl.class))).thenReturn(true);
            when(jwtService.generateToken(any(UserDetailsImpl.class), any(UUID.class))).thenReturn("newAccessToken");
            when(jwtService.generateRefreshToken(any(UserDetailsImpl.class), any(UUID.class))).thenReturn("newRefreshToken");
            when(jwtService.getJwtExpiration()).thenReturn(3600000L);
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // When
            AuthResponse response = authService.refreshToken(request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("newAccessToken");
            assertThat(response.getRefreshToken()).isEqualTo("newRefreshToken");

            verify(jwtService).extractUsernameFromRefreshToken("validRefreshToken");
            verify(jwtService).isRefreshTokenValid(eq("validRefreshToken"), any(UserDetailsImpl.class));
        }

        @Test
        @DisplayName("Should throw exception when refresh token is invalid")
        void shouldThrowExceptionWhenRefreshTokenInvalid() {
            // Given
            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken("invalidRefreshToken");

            when(jwtService.extractUsernameFromRefreshToken("invalidRefreshToken")).thenReturn("test@example.com");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(jwtService.isRefreshTokenValid(eq("invalidRefreshToken"), any(UserDetailsImpl.class))).thenReturn(false);

            // When/Then
            assertThatThrownBy(() -> authService.refreshToken(request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Invalid refresh token");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("Logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should logout user successfully")
        void shouldLogoutSuccessfully() {
            // Given
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // When
            authService.logout("test@example.com");

            // Then
            verify(userRepository).findByEmail("test@example.com");
            verify(userRepository).save(argThat(user ->
                    user.getRefreshToken() == null && !user.getIsOnline()
            ));
        }

        @Test
        @DisplayName("Should throw exception when user not found during logout")
        void shouldThrowExceptionWhenUserNotFound() {
            // Given
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> authService.logout("unknown@example.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User not found");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("Get Current User Tests")
    class GetCurrentUserTests {

        @Test
        @DisplayName("Should return current user when found")
        void shouldReturnCurrentUser() {
            // Given
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

            // When
            var response = authService.getCurrentUser("test@example.com");

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getEmail()).isEqualTo("test@example.com");
            assertThat(response.getFirstName()).isEqualTo("John");
            assertThat(response.getLastName()).isEqualTo("Doe");
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Given
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> authService.getCurrentUser("unknown@example.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User not found");
        }
    }
}

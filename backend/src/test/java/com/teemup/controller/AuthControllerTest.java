package com.teemup.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teemup.dto.auth.AuthResponse;
import com.teemup.dto.auth.LoginRequest;
import com.teemup.dto.auth.RefreshTokenRequest;
import com.teemup.dto.auth.RegisterRequest;
import com.teemup.dto.user.UserResponse;
import com.teemup.exception.EmailAlreadyExistsException;
import com.teemup.exception.FaceVerificationException;
import com.teemup.exception.InvalidTokenException;
import com.teemup.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("AuthController Integration Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    private UserResponse testUserResponse;
    private AuthResponse testAuthResponse;

    @BeforeEach
    void setUp() {
        testUserResponse = UserResponse.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .isVerified(true)
                .isOnline(true)
                .build();

        testAuthResponse = AuthResponse.of(
                "accessToken123",
                "refreshToken123",
                3600000L,
                testUserResponse
        );
    }

    @Nested
    @DisplayName("POST /api/auth/register")
    class RegisterEndpointTests {

        @Test
        @DisplayName("Should register user successfully")
        void shouldRegisterUserSuccessfully() throws Exception {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setEmail("new@example.com");
            request.setPassword("Password123!");
            request.setFirstName("Jane");
            request.setLastName("Doe");
            request.setVerificationImage("base64imagedata");

            when(authService.register(any(RegisterRequest.class))).thenReturn(testAuthResponse);

            // When/Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.accessToken").value("accessToken123"))
                    .andExpect(jsonPath("$.refreshToken").value("refreshToken123"))
                    .andExpect(jsonPath("$.user.email").value("test@example.com"));

            verify(authService).register(any(RegisterRequest.class));
        }

        @Test
        @DisplayName("Should return 409 when email already exists")
        void shouldReturn409WhenEmailExists() throws Exception {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setEmail("existing@example.com");
            request.setPassword("Password123!");
            request.setFirstName("Jane");
            request.setLastName("Doe");
            request.setVerificationImage("base64imagedata");

            when(authService.register(any(RegisterRequest.class)))
                    .thenThrow(new EmailAlreadyExistsException("existing@example.com"));

            // When/Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("Should return 400 when face verification fails")
        void shouldReturn400WhenFaceVerificationFails() throws Exception {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setEmail("new@example.com");
            request.setPassword("Password123!");
            request.setFirstName("Jane");
            request.setLastName("Doe");
            request.setVerificationImage("base64imagedata");

            when(authService.register(any(RegisterRequest.class)))
                    .thenThrow(new FaceVerificationException("Aucun visage detecte"));

            // When/Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 when user is not adult")
        void shouldReturn400WhenUserNotAdult() throws Exception {
            // Given
            RegisterRequest request = new RegisterRequest();
            request.setEmail("new@example.com");
            request.setPassword("Password123!");
            request.setFirstName("Jane");
            request.setLastName("Doe");
            request.setVerificationImage("base64imagedata");

            when(authService.register(any(RegisterRequest.class)))
                    .thenThrow(new FaceVerificationException("Vous devez avoir 18 ans"));

            // When/Then
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginEndpointTests {

        @Test
        @DisplayName("Should login user successfully")
        void shouldLoginSuccessfully() throws Exception {
            // Given
            LoginRequest request = new LoginRequest();
            request.setEmail("test@example.com");
            request.setPassword("password123");

            when(authService.login(any(LoginRequest.class))).thenReturn(testAuthResponse);

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").value("accessToken123"))
                    .andExpect(jsonPath("$.refreshToken").value("refreshToken123"))
                    .andExpect(jsonPath("$.user.email").value("test@example.com"));

            verify(authService).login(any(LoginRequest.class));
        }

        @Test
        @DisplayName("Should return 401 when credentials are invalid")
        void shouldReturn401WhenCredentialsInvalid() throws Exception {
            // Given
            LoginRequest request = new LoginRequest();
            request.setEmail("test@example.com");
            request.setPassword("wrongpassword");

            when(authService.login(any(LoginRequest.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class RefreshTokenEndpointTests {

        @Test
        @DisplayName("Should refresh token successfully")
        void shouldRefreshTokenSuccessfully() throws Exception {
            // Given
            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken("validRefreshToken");

            AuthResponse newAuthResponse = AuthResponse.of(
                    "newAccessToken",
                    "newRefreshToken",
                    3600000L,
                    testUserResponse
            );

            when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(newAuthResponse);

            // When/Then
            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").value("newAccessToken"))
                    .andExpect(jsonPath("$.refreshToken").value("newRefreshToken"));

            verify(authService).refreshToken(any(RefreshTokenRequest.class));
        }

        @Test
        @DisplayName("Should return 401 when refresh token is invalid")
        void shouldReturn401WhenRefreshTokenInvalid() throws Exception {
            // Given
            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken("invalidRefreshToken");

            when(authService.refreshToken(any(RefreshTokenRequest.class)))
                    .thenThrow(new InvalidTokenException("Token de rafraîchissement invalide"));

            // When/Then
            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }
}

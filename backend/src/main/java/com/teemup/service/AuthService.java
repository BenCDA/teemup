package com.teemup.service;

import com.teemup.dto.auth.*;
import com.teemup.dto.user.UserResponse;
import com.teemup.dto.verification.FaceVerificationResponse;
import com.teemup.entity.User;
import com.teemup.exception.FaceVerificationException;
import com.teemup.repository.UserRepository;
import com.teemup.security.JwtService;
import com.teemup.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final FaceVerificationService faceVerificationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Verify face before registration
        log.info("Starting face verification for registration");
        FaceVerificationResponse verification = faceVerificationService.verifyFace(request.getVerificationImage());

        if (!verification.isFaceDetected()) {
            throw new FaceVerificationException("Aucun visage détecté. Veuillez prendre une photo claire de votre visage.");
        }

        if (!verification.isAdult()) {
            throw new FaceVerificationException("Vous devez avoir 18 ans ou plus pour vous inscrire. Âge détecté: " + verification.getAge() + " ans.");
        }

        log.info("Face verification passed: age={}, gender={}", verification.getAge(), verification.getGender());

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .provider(User.AuthProvider.LOCAL)
                .build();

        // Apply verification data to user
        faceVerificationService.applyVerificationToUser(user, verification);

        user = userRepository.save(user);

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String accessToken = jwtService.generateToken(userDetails, user.getId());
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtService.getJwtExpiration(),
                UserResponse.fromEntity(user)
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String accessToken = jwtService.generateToken(userDetails, user.getId());
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        user.setRefreshToken(refreshToken);
        user.setIsOnline(true);
        userRepository.save(user);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                jwtService.getJwtExpiration(),
                UserResponse.fromEntity(user)
        );
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        String userEmail = jwtService.extractUsernameFromRefreshToken(refreshToken);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        if (!jwtService.isRefreshTokenValid(refreshToken, userDetails)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String newAccessToken = jwtService.generateToken(userDetails, user.getId());
        String newRefreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        return AuthResponse.of(
                newAccessToken,
                newRefreshToken,
                jwtService.getJwtExpiration(),
                UserResponse.fromEntity(user)
        );
    }

    @Transactional
    public void logout(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRefreshToken(null);
        user.setIsOnline(false);
        userRepository.save(user);
    }

    public UserResponse getCurrentUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserResponse.fromEntity(user);
    }
}

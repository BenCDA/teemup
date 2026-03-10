package com.teemup.service;

import com.teemup.dto.auth.AuthResponse;
import com.teemup.dto.auth.LoginRequest;
import com.teemup.dto.auth.RefreshTokenRequest;
import com.teemup.dto.auth.RegisterRequest;
import com.teemup.dto.user.UserResponse;
import com.teemup.dto.verification.FaceVerificationResponse;
import com.teemup.entity.User;
import com.teemup.exception.EmailAlreadyExistsException;
import com.teemup.exception.FaceVerificationException;
import com.teemup.exception.InvalidTokenException;
import com.teemup.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final FaceVerificationService faceVerificationService;

    /**
     * Hash a refresh token with SHA-256 before storing in DB.
     * This prevents token theft from a compromised database.
     */
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
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

        // Anti-spoof check: reject fake photos (screen captures, printed photos)
        if (!verification.isRealFace()) {
            throw new FaceVerificationException("La vérification anti-usurpation a échoué. Veuillez prendre une photo réelle de votre visage dans un endroit bien éclairé.");
        }

        log.info("Face verification passed: age={}, gender={}, realFace={}", verification.getAge(), verification.getGender(), verification.isRealFace());

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .provider(User.AuthProvider.LOCAL)
                .isPro(false)
                .build();

        // Apply verification data to user
        faceVerificationService.applyVerificationToUser(user, verification);

        user = userRepository.save(user);

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String accessToken = jwtService.generateToken(userDetails, user.getId());
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        user.setRefreshToken(hashToken(refreshToken));
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
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        String accessToken = jwtService.generateToken(userDetails, user.getId());
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        user.setRefreshToken(hashToken(refreshToken));
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
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        if (!jwtService.isRefreshTokenValid(refreshToken, userDetails)) {
            throw new InvalidTokenException("Token de rafraîchissement invalide");
        }

        // Verify token matches the one stored in DB (hashed)
        String storedHash = user.getRefreshToken();
        if (storedHash == null || !storedHash.equals(hashToken(refreshToken))) {
            throw new InvalidTokenException("Token de rafraîchissement révoqué");
        }

        String newAccessToken = jwtService.generateToken(userDetails, user.getId());
        String newRefreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        user.setRefreshToken(hashToken(newRefreshToken));
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
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        user.setRefreshToken(null);
        user.setIsOnline(false);
        userRepository.save(user);
    }

    public UserResponse getCurrentUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        return UserResponse.fromEntity(user);
    }
}

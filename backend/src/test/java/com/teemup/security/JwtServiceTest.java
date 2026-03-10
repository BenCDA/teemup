package com.teemup.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("JwtService Tests")
class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;
    private UUID userId;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Base64 encoded keys (>= 32 bytes)
        ReflectionTestUtils.setField(jwtService, "secretKey",
                "dGVzdC1zZWNyZXQta2V5LWZvci11bml0LXRlc3RzLW11c3QtYmUtYXQtbGVhc3QtMzItY2hhcmFjdGVycw==");
        ReflectionTestUtils.setField(jwtService, "refreshSecretKey",
                "dGVzdC1yZWZyZXNoLXNlY3JldC1rZXktZm9yLXVuaXQtdGVzdHMtbXVzdC1iZS1hdC1sZWFzdC0zMi1jaGFycw==");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800000L);

        userId = UUID.randomUUID();
        userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("test@example.com");
    }

    @Nested
    @DisplayName("Token generation")
    class TokenGeneration {

        @Test
        @DisplayName("Should generate a non-null access token")
        void shouldGenerateAccessToken() {
            String token = jwtService.generateToken(userDetails, userId);

            assertThat(token).isNotNull().isNotEmpty();
        }

        @Test
        @DisplayName("Should generate a non-null refresh token")
        void shouldGenerateRefreshToken() {
            String token = jwtService.generateRefreshToken(userDetails, userId);

            assertThat(token).isNotNull().isNotEmpty();
        }

        @Test
        @DisplayName("Access and refresh tokens should be different")
        void tokensShouldBeDifferent() {
            String accessToken = jwtService.generateToken(userDetails, userId);
            String refreshToken = jwtService.generateRefreshToken(userDetails, userId);

            assertThat(accessToken).isNotEqualTo(refreshToken);
        }
    }

    @Nested
    @DisplayName("Token extraction")
    class TokenExtraction {

        @Test
        @DisplayName("Should extract username from access token")
        void shouldExtractUsername() {
            String token = jwtService.generateToken(userDetails, userId);

            assertThat(jwtService.extractUsername(token)).isEqualTo("test@example.com");
        }

        @Test
        @DisplayName("Should extract userId from access token")
        void shouldExtractUserId() {
            String token = jwtService.generateToken(userDetails, userId);

            assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
        }

        @Test
        @DisplayName("Should extract username from refresh token")
        void shouldExtractUsernameFromRefreshToken() {
            String token = jwtService.generateRefreshToken(userDetails, userId);

            assertThat(jwtService.extractUsernameFromRefreshToken(token)).isEqualTo("test@example.com");
        }
    }

    @Nested
    @DisplayName("Token validation")
    class TokenValidation {

        @Test
        @DisplayName("Should validate a correct access token")
        void shouldValidateCorrectToken() {
            String token = jwtService.generateToken(userDetails, userId);

            assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
        }

        @Test
        @DisplayName("Should reject token for wrong username")
        void shouldRejectWrongUsername() {
            String token = jwtService.generateToken(userDetails, userId);

            UserDetails otherUser = mock(UserDetails.class);
            when(otherUser.getUsername()).thenReturn("other@example.com");

            assertThat(jwtService.isTokenValid(token, otherUser)).isFalse();
        }

        @Test
        @DisplayName("Should validate a correct refresh token")
        void shouldValidateCorrectRefreshToken() {
            String token = jwtService.generateRefreshToken(userDetails, userId);

            assertThat(jwtService.isRefreshTokenValid(token, userDetails)).isTrue();
        }

        @Test
        @DisplayName("Should reject invalid refresh token")
        void shouldRejectInvalidRefreshToken() {
            assertThat(jwtService.isRefreshTokenValid("invalid.token.here", userDetails)).isFalse();
        }

        @Test
        @DisplayName("Should reject access token as refresh token")
        void shouldRejectAccessTokenAsRefresh() {
            String accessToken = jwtService.generateToken(userDetails, userId);

            // Access token signed with different key, should fail refresh validation
            assertThat(jwtService.isRefreshTokenValid(accessToken, userDetails)).isFalse();
        }
    }

    @Nested
    @DisplayName("Configuration")
    class Configuration {

        @Test
        @DisplayName("Should return configured expiration")
        void shouldReturnExpiration() {
            assertThat(jwtService.getJwtExpiration()).isEqualTo(86400000L);
        }
    }
}

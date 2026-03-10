package com.teemup.service;

import com.teemup.dto.verification.FaceVerificationResponse;
import com.teemup.entity.User;
import com.teemup.exception.FaceVerificationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FaceVerificationService Tests")
class FaceVerificationServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private FaceVerificationService faceVerificationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(faceVerificationService, "faceVerificationUrl", "http://localhost:5000");
        ReflectionTestUtils.setField(faceVerificationService, "faceVerificationApiKey", "test-face-verification-api-key");
    }

    @Nested
    @DisplayName("verifyFace")
    class VerifyFaceTests {

        @Test
        @DisplayName("Should return verification result on success")
        void shouldReturnResult() {
            FaceVerificationResponse expected = FaceVerificationResponse.builder()
                    .success(true).faceDetected(true).age(25).gender("male").genderConfidence(0.95).isAdult(true)
                    .build();

            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(FaceVerificationResponse.class)))
                    .thenReturn(new ResponseEntity<>(expected, HttpStatus.OK));

            FaceVerificationResponse result = faceVerificationService.verifyFace("base64image");

            assertThat(result).isNotNull();
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getAge()).isEqualTo(25);
        }

        @Test
        @DisplayName("Should throw when response body is null")
        void shouldThrowWhenBodyNull() {
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(FaceVerificationResponse.class)))
                    .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

            assertThatThrownBy(() -> faceVerificationService.verifyFace("base64image"))
                    .isInstanceOf(FaceVerificationException.class)
                    .hasMessageContaining("vide");
        }

        @Test
        @DisplayName("Should throw on RestClientException")
        void shouldThrowOnRestClientException() {
            when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(FaceVerificationResponse.class)))
                    .thenThrow(new RestClientException("Connection refused"));

            assertThatThrownBy(() -> faceVerificationService.verifyFace("base64image"))
                    .isInstanceOf(FaceVerificationException.class)
                    .hasMessageContaining("Connection refused");
        }
    }

    @Nested
    @DisplayName("applyVerificationToUser")
    class ApplyVerificationTests {

        @Test
        @DisplayName("Should set male gender from English")
        void shouldSetMaleFromEnglish() {
            User user = User.builder().id(java.util.UUID.randomUUID()).build();
            FaceVerificationResponse verification = FaceVerificationResponse.builder()
                    .success(true).faceDetected(true).isAdult(true).isRealFace(true).age(30).gender("Man").genderConfidence(0.9)
                    .build();

            faceVerificationService.applyVerificationToUser(user, verification);

            assertThat(user.getIsVerified()).isTrue();
            assertThat(user.getVerifiedAge()).isEqualTo(30);
            assertThat(user.getVerifiedGender()).isEqualTo(User.VerifiedGender.MALE);
        }

        @Test
        @DisplayName("Should set female gender from French")
        void shouldSetFemaleFromFrench() {
            User user = User.builder().id(java.util.UUID.randomUUID()).build();
            FaceVerificationResponse verification = FaceVerificationResponse.builder()
                    .success(true).faceDetected(true).isAdult(true).isRealFace(true).age(28).gender("Femme").genderConfidence(0.85)
                    .build();

            faceVerificationService.applyVerificationToUser(user, verification);

            assertThat(user.getVerifiedGender()).isEqualTo(User.VerifiedGender.FEMALE);
        }

        @Test
        @DisplayName("Should leave gender null for unrecognized value")
        void shouldLeaveGenderNullForUnrecognized() {
            User user = User.builder().id(java.util.UUID.randomUUID()).build();
            FaceVerificationResponse verification = FaceVerificationResponse.builder()
                    .success(true).faceDetected(true).isAdult(true).isRealFace(true).age(25).gender("unknown").genderConfidence(0.5)
                    .build();

            faceVerificationService.applyVerificationToUser(user, verification);

            assertThat(user.getIsVerified()).isTrue();
            assertThat(user.getVerifiedGender()).isNull();
        }

        @Test
        @DisplayName("Should not verify user when verification failed")
        void shouldNotVerifyWhenFailed() {
            User user = User.builder().id(java.util.UUID.randomUUID()).isVerified(false).build();
            FaceVerificationResponse verification = FaceVerificationResponse.builder()
                    .success(false).faceDetected(false)
                    .build();

            faceVerificationService.applyVerificationToUser(user, verification);

            assertThat(user.getIsVerified()).isFalse();
        }
    }

    @Nested
    @DisplayName("isEligibleForRegistration")
    class EligibilityTests {

        @Test
        @DisplayName("Should return true when all conditions met")
        void shouldReturnTrueWhenEligible() {
            FaceVerificationResponse verification = FaceVerificationResponse.builder()
                    .success(true).faceDetected(true).isAdult(true).isRealFace(true)
                    .build();

            assertThat(faceVerificationService.isEligibleForRegistration(verification)).isTrue();
        }

        @Test
        @DisplayName("Should return false when not adult")
        void shouldReturnFalseWhenNotAdult() {
            FaceVerificationResponse verification = FaceVerificationResponse.builder()
                    .success(true).faceDetected(true).isAdult(false)
                    .build();

            assertThat(faceVerificationService.isEligibleForRegistration(verification)).isFalse();
        }

        @Test
        @DisplayName("Should return false when no face detected")
        void shouldReturnFalseWhenNoFace() {
            FaceVerificationResponse verification = FaceVerificationResponse.builder()
                    .success(true).faceDetected(false).isAdult(true)
                    .build();

            assertThat(faceVerificationService.isEligibleForRegistration(verification)).isFalse();
        }

        @Test
        @DisplayName("Should return false when not successful")
        void shouldReturnFalseWhenNotSuccess() {
            FaceVerificationResponse verification = FaceVerificationResponse.builder()
                    .success(false).faceDetected(true).isAdult(true)
                    .build();

            assertThat(faceVerificationService.isEligibleForRegistration(verification)).isFalse();
        }
    }
}

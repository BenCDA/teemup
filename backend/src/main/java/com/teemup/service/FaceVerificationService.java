package com.teemup.service;

import com.teemup.dto.verification.FaceVerificationRequest;
import com.teemup.dto.verification.FaceVerificationResponse;
import com.teemup.entity.User;
import com.teemup.exception.FaceVerificationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaceVerificationService {

    @Value("${face.verification.url:http://localhost:5000}")
    private String faceVerificationUrl;

    @Value("${face.verification.api-key}")
    private String faceVerificationApiKey;

    private final RestTemplate restTemplate;

    /**
     * Verify a face image and return the analysis result.
     */
    public FaceVerificationResponse verifyFace(String base64Image) {
        try {
            String url = faceVerificationUrl + "/verify";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-API-Key", faceVerificationApiKey);

            FaceVerificationRequest request = FaceVerificationRequest.builder()
                    .image(base64Image)
                    .build();

            HttpEntity<FaceVerificationRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<FaceVerificationResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    FaceVerificationResponse.class
            );

            if (response.getBody() == null) {
                throw new FaceVerificationException("La réponse du service de vérification est vide");
            }

            log.info("Face verification result: success={}, age={}, gender={}, isAdult={}, isRealFace={}",
                    response.getBody().isSuccess(),
                    response.getBody().getAge(),
                    response.getBody().getGender(),
                    response.getBody().isAdult(),
                    response.getBody().isRealFace());

            return response.getBody();

        } catch (RestClientException e) {
            log.error("Error calling face verification service: {}", e.getMessage());
            throw new FaceVerificationException("Erreur lors de la vérification faciale: " + e.getMessage());
        }
    }

    /**
     * Apply verification result to a user entity.
     * Only sets isVerified=true if ALL conditions are met: success, face detected, adult, and real face.
     */
    public void applyVerificationToUser(User user, FaceVerificationResponse verification) {
        boolean allConditionsMet = verification.isSuccess()
                && verification.isFaceDetected()
                && verification.isAdult()
                && verification.isRealFace();

        if (allConditionsMet) {
            user.setIsVerified(true);
            user.setVerifiedAge(verification.getAge());
            user.setVerificationConfidence(verification.getGenderConfidence());
            user.setVerifiedAt(LocalDateTime.now());

            // Set gender - check for both male and female variations explicitly
            if (verification.getGender() != null) {
                String gender = verification.getGender().toLowerCase().trim();
                if (gender.equals("homme") || gender.equals("man") || gender.equals("male")) {
                    user.setVerifiedGender(User.VerifiedGender.MALE);
                } else if (gender.equals("femme") || gender.equals("woman") || gender.equals("female")) {
                    user.setVerifiedGender(User.VerifiedGender.FEMALE);
                }
                // If gender is unrecognized, leave it as null (don't assume)
            }

            log.info("Verification applied to user: verified=true, age={}, gender={}",
                    verification.getAge(), verification.getGender());
        } else {
            user.setIsVerified(false);
            log.warn("Verification NOT applied to user: success={}, faceDetected={}, adult={}, realFace={}",
                    verification.isSuccess(), verification.isFaceDetected(),
                    verification.isAdult(), verification.isRealFace());
        }
    }

    /**
     * Check if a verification result allows registration.
     * Requires: success, face detected, adult, AND real face (anti-spoof).
     */
    public boolean isEligibleForRegistration(FaceVerificationResponse verification) {
        boolean eligible = verification.isSuccess() &&
               verification.isFaceDetected() &&
               verification.isAdult() &&
               verification.isRealFace();

        log.info("Registration eligibility check: eligible={}, success={}, faceDetected={}, adult={}, realFace={}",
                eligible, verification.isSuccess(), verification.isFaceDetected(),
                verification.isAdult(), verification.isRealFace());

        return eligible;
    }
}

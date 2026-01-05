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

    private final RestTemplate restTemplate;

    /**
     * Verify a face image and return the analysis result.
     */
    public FaceVerificationResponse verifyFace(String base64Image) {
        try {
            String url = faceVerificationUrl + "/verify";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

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

            log.info("Face verification result: success={}, age={}, gender={}",
                    response.getBody().isSuccess(),
                    response.getBody().getAge(),
                    response.getBody().getGender());

            return response.getBody();

        } catch (RestClientException e) {
            log.error("Error calling face verification service: {}", e.getMessage());
            throw new FaceVerificationException("Erreur lors de la vérification faciale: " + e.getMessage());
        }
    }

    /**
     * Apply verification result to a user entity.
     */
    public void applyVerificationToUser(User user, FaceVerificationResponse verification) {
        if (verification.isSuccess() && verification.isFaceDetected()) {
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
        }
    }

    /**
     * Check if a verification result allows registration (adult check).
     */
    public boolean isEligibleForRegistration(FaceVerificationResponse verification) {
        return verification.isSuccess() &&
               verification.isFaceDetected() &&
               verification.isAdult();
    }
}

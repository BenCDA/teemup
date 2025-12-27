package com.teemup.controller;

import com.teemup.dto.verification.FaceVerificationRequest;
import com.teemup.dto.verification.FaceVerificationResponse;
import com.teemup.service.FaceVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
@Slf4j
public class VerificationController {

    private final FaceVerificationService faceVerificationService;

    /**
     * Verify a face image for age and gender.
     * This endpoint is public and used during registration.
     */
    @PostMapping("/face")
    public ResponseEntity<FaceVerificationResponse> verifyFace(
            @Valid @RequestBody FaceVerificationRequest request) {
        log.info("Received face verification request");

        FaceVerificationResponse response = faceVerificationService.verifyFace(request.getImage());

        return ResponseEntity.ok(response);
    }

    /**
     * Check if the face verification service is available.
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Verification service is available");
    }
}

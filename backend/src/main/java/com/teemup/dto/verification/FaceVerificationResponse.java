package com.teemup.dto.verification;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceVerificationResponse {

    private boolean success;

    @JsonProperty("face_detected")
    private boolean faceDetected;

    private Integer age;

    @JsonProperty("age_range")
    private String ageRange;

    private String gender;

    @JsonProperty("gender_confidence")
    private Double genderConfidence;

    @JsonProperty("is_adult")
    private boolean isAdult;

    @JsonProperty("is_real_face")
    private boolean isRealFace;

    private String message;
}

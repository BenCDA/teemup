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
    private boolean faceDetected;
    private Integer age;
    private String ageRange;
    private String gender;
    private Double genderConfidence;

    @JsonProperty("isAdult")
    private boolean isAdult;

    @JsonProperty("isRealFace")
    private boolean isRealFace;

    private String message;
}

package com.teemup.dto.verification;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceVerificationRequest {

    @NotBlank(message = "L'image est requise")
    private String image; // Base64 encoded image
}

package com.teemup.dto.moderation;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportUserRequest {

    @NotBlank(message = "La raison est obligatoire")
    private String reason;

    private String description;
}

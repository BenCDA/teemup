package com.teemup.dto.user;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(min = 1, max = 50, message = "Le prénom doit contenir entre 1 et 50 caractères")
    private String firstName;

    @Size(min = 1, max = 50, message = "Le nom doit contenir entre 1 et 50 caractères")
    private String lastName;

    private String profilePicture;
    private String coverImage;

    @Size(max = 500, message = "La bio ne peut pas dépasser 500 caractères")
    private String bio;

    private Set<String> sports;
    private Boolean onboardingCompleted;

    @DecimalMin(value = "-90.0", message = "Latitude invalide")
    @DecimalMax(value = "90.0", message = "Latitude invalide")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude invalide")
    @DecimalMax(value = "180.0", message = "Longitude invalide")
    private Double longitude;

    // Pro subscription
    private Boolean isPro;
}

package com.teemup.dto.event;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSportEventRequest {

    @NotBlank(message = "Le sport est requis")
    @Size(max = 50, message = "Le sport ne peut pas dépasser 50 caractères")
    private String sport;

    @Size(max = 100, message = "Le titre ne peut pas dépasser 100 caractères")
    private String title;

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    private String description;

    @Size(max = 200, message = "La localisation ne peut pas dépasser 200 caractères")
    private String location;

    @Min(value = -90, message = "Latitude invalide")
    @Max(value = 90, message = "Latitude invalide")
    private Double latitude;

    @Min(value = -180, message = "Longitude invalide")
    @Max(value = 180, message = "Longitude invalide")
    private Double longitude;

    @NotNull(message = "La date est requise")
    @FutureOrPresent(message = "La date doit être aujourd'hui ou dans le futur")
    private LocalDate date;

    @NotNull(message = "L'heure de début est requise")
    private LocalTime startTime;

    @NotNull(message = "L'heure de fin est requise")
    private LocalTime endTime;

    @NotBlank(message = "La récurrence est requise")
    @Pattern(regexp = "NONE|DAILY|WEEKLY|BIWEEKLY|MONTHLY", message = "Type de récurrence invalide")
    private String recurrence;

    @NotNull(message = "La visibilité est requise")
    private Boolean isPublic;

    @Min(value = 2, message = "Minimum 2 participants")
    @Max(value = 100, message = "Maximum 100 participants")
    private Integer maxParticipants;

    private Boolean isPaid;

    @Min(value = 0, message = "Le prix ne peut pas être négatif")
    @Max(value = 10000, message = "Le prix ne peut pas dépasser 10000€")
    private Double price;

    @AssertTrue(message = "L'heure de fin doit être après l'heure de début")
    public boolean isValidTimeRange() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return endTime.isAfter(startTime);
    }

    @AssertTrue(message = "Le prix est requis quand l'événement est payant")
    public boolean isValidPaidEvent() {
        if (isPaid == null || !isPaid) {
            return true;
        }
        return price != null;
    }
}

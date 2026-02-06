package com.teemup.dto.event;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSportEventRequest {

    @NotBlank(message = "Sport is required")
    @Size(max = 50, message = "Sport name cannot exceed 50 characters")
    private String sport;

    @Size(max = 100, message = "Title cannot exceed 100 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Size(max = 200, message = "Location cannot exceed 200 characters")
    private String location;

    @Min(value = -90, message = "Latitude must be between -90 and 90")
    @Max(value = 90, message = "Latitude must be between -90 and 90")
    private Double latitude;

    @Min(value = -180, message = "Longitude must be between -180 and 180")
    @Max(value = 180, message = "Longitude must be between -180 and 180")
    private Double longitude;

    @NotNull(message = "Date is required")
    @FutureOrPresent(message = "Event date must be today or in the future")
    private LocalDate date;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @Pattern(regexp = "NONE|DAILY|WEEKLY|BIWEEKLY|MONTHLY", message = "Invalid recurrence type")
    private String recurrence = "NONE";

    private Boolean isPublic = true;

    @Min(value = 2, message = "Minimum 2 participants required")
    @Max(value = 100, message = "Maximum 100 participants allowed")
    private Integer maxParticipants;

    // Paid event fields (only for Pro users)
    private Boolean isPaid = false;

    @Min(value = 0, message = "Price cannot be negative")
    @Max(value = 10000, message = "Price cannot exceed 10000€")
    private Double price;

    /**
     * Validates that endTime is after startTime.
     * Called by custom validator or in service layer.
     */
    @AssertTrue(message = "End time must be after start time")
    public boolean isValidTimeRange() {
        if (startTime == null || endTime == null) {
            return true; // Let @NotNull handle null cases
        }
        return endTime.isAfter(startTime);
    }
}

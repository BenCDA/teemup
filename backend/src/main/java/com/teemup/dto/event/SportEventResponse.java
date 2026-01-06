package com.teemup.dto.event;

import com.teemup.entity.SportEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SportEventResponse {

    private UUID id;
    private UUID userId;
    private String sport;
    private String title;
    private String description;
    private String location;
    private Double latitude;
    private Double longitude;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String recurrence;
    private Boolean isPublic;

    // Distance from user (calculated field, null if not applicable)
    private Double distanceKm;

    public static SportEventResponse fromEntity(SportEvent event) {
        return SportEventResponse.builder()
                .id(event.getId())
                .userId(event.getUser().getId())
                .sport(event.getSport())
                .title(event.getTitle())
                .description(event.getDescription())
                .location(event.getLocation())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .date(event.getDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .recurrence(event.getRecurrence().name())
                .isPublic(event.getIsPublic())
                .build();
    }

    public static SportEventResponse fromEntityWithDistance(SportEvent event, Double distanceKm) {
        SportEventResponse response = fromEntity(event);
        response.setDistanceKm(distanceKm);
        return response;
    }
}

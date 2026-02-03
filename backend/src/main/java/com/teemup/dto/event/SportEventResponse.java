package com.teemup.dto.event;

import com.teemup.dto.user.PublicUserResponse;
import com.teemup.entity.EventParticipant;
import com.teemup.entity.SportEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private Integer maxParticipants;
    private Boolean isPaid;
    private Double price;

    // Distance from user (calculated field, null if not applicable)
    private Double distanceKm;

    // Organizer info
    private PublicUserResponse organizer;

    // Participants info
    private List<ParticipantInfo> participants;
    private Integer participantCount;
    private Boolean isParticipating; // Is the requesting user participating?

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantInfo {
        private UUID userId;
        private String fullName;
        private String profilePicture;
        private String status;
    }

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
                .maxParticipants(event.getMaxParticipants())
                .isPaid(event.getIsPaid())
                .price(event.getPrice())
                .organizer(PublicUserResponse.fromEntity(event.getUser()))
                .build();
    }

    public static SportEventResponse fromEntityWithDetails(SportEvent event, UUID requesterId) {
        List<EventParticipant> confirmedParticipants = event.getParticipants().stream()
                .filter(p -> p.getStatus() == EventParticipant.ParticipantStatus.CONFIRMED)
                .collect(Collectors.toList());

        boolean isParticipating = event.getParticipants().stream()
                .anyMatch(p -> p.getUser().getId().equals(requesterId)
                        && p.getStatus() == EventParticipant.ParticipantStatus.CONFIRMED);

        List<ParticipantInfo> participantInfos = confirmedParticipants.stream()
                .map(p -> ParticipantInfo.builder()
                        .userId(p.getUser().getId())
                        .fullName(p.getUser().getFullName())
                        .profilePicture(p.getUser().getProfilePicture())
                        .status(p.getStatus().name())
                        .build())
                .collect(Collectors.toList());

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
                .maxParticipants(event.getMaxParticipants())
                .isPaid(event.getIsPaid())
                .price(event.getPrice())
                .organizer(PublicUserResponse.fromEntity(event.getUser()))
                .participants(participantInfos)
                .participantCount(confirmedParticipants.size())
                .isParticipating(isParticipating)
                .build();
    }

    public static SportEventResponse fromEntityWithDistance(SportEvent event, Double distanceKm) {
        SportEventResponse response = fromEntity(event);
        response.setDistanceKm(distanceKm);
        return response;
    }
}

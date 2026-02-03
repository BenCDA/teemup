package com.teemup.dto.event;

import com.teemup.entity.EventParticipant;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ParticipantResponse {
    private UUID id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String profilePictureUrl;
    private String status;
    private LocalDateTime joinedAt;

    public static ParticipantResponse fromEntity(EventParticipant participant) {
        return ParticipantResponse.builder()
                .id(participant.getId())
                .userId(participant.getUser().getId())
                .firstName(participant.getUser().getFirstName())
                .lastName(participant.getUser().getLastName())
                .profilePictureUrl(participant.getUser().getProfilePicture())
                .status(participant.getStatus().name())
                .joinedAt(participant.getJoinedAt())
                .build();
    }
}

package com.teemup.dto.messaging;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationRequest {

    private String name;

    @NotEmpty(message = "Participants are required")
    private Set<UUID> participantIds;

    private String type;
}

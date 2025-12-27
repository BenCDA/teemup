package com.teemup.dto.messaging;

import com.teemup.dto.user.UserResponse;
import com.teemup.entity.Conversation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private UUID id;
    private String name;
    private String type;
    private Set<UserResponse> participants;
    private MessageResponse lastMessage;
    private Long unreadCount;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;

    public static ConversationResponse fromEntity(Conversation conversation) {
        return ConversationResponse.builder()
                .id(conversation.getId())
                .name(conversation.getName())
                .type(conversation.getType().name())
                .participants(conversation.getParticipants().stream()
                        .map(UserResponse::fromEntity)
                        .collect(Collectors.toSet()))
                .lastMessageAt(conversation.getLastMessageAt())
                .createdAt(conversation.getCreatedAt())
                .build();
    }

    public static ConversationResponse fromEntityWithDetails(
            Conversation conversation,
            MessageResponse lastMessage,
            Long unreadCount
    ) {
        ConversationResponse response = fromEntity(conversation);
        response.setLastMessage(lastMessage);
        response.setUnreadCount(unreadCount);
        return response;
    }
}

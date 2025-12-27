package com.teemup.dto.messaging;

import com.teemup.dto.user.UserResponse;
import com.teemup.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private UUID id;
    private String content;
    private UserResponse sender;
    private UUID conversationId;
    private String type;
    private Set<UUID> readBy;
    private Boolean isEdited;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MessageResponse fromEntity(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .sender(UserResponse.fromEntity(message.getSender()))
                .conversationId(message.getConversation().getId())
                .type(message.getType().name())
                .readBy(message.getReadBy())
                .isEdited(message.getIsEdited())
                .isDeleted(message.getIsDeleted())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }
}

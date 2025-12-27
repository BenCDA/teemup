package com.teemup.dto.notification;

import com.teemup.dto.user.UserResponse;
import com.teemup.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private UUID id;
    private UserResponse fromUser;
    private String type;
    private String title;
    private String content;
    private String referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .fromUser(notification.getFromUser() != null
                        ? UserResponse.fromEntity(notification.getFromUser())
                        : null)
                .type(notification.getType().name())
                .title(notification.getTitle())
                .content(notification.getContent())
                .referenceId(notification.getReferenceId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

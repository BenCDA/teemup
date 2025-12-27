package com.teemup.service;

import com.teemup.dto.notification.NotificationResponse;
import com.teemup.entity.Notification;
import com.teemup.entity.User;
import com.teemup.repository.NotificationRepository;
import com.teemup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationResponse createNotification(
            User recipient,
            User fromUser,
            Notification.NotificationType type,
            String title,
            String content,
            String referenceId
    ) {
        Notification notification = Notification.builder()
                .user(recipient)
                .fromUser(fromUser)
                .type(type)
                .title(title)
                .content(content)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        return NotificationResponse.fromEntity(notification);
    }

    public Page<NotificationResponse> getUserNotifications(UUID userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId,
                PageRequest.of(page, size)
        ).map(NotificationResponse::fromEntity);
    }

    public List<NotificationResponse> getUnreadNotifications(UUID userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to update this notification");
        }

        notification.setIsRead(true);
        notification = notificationRepository.save(notification);

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this notification");
        }

        notificationRepository.delete(notification);
    }
}

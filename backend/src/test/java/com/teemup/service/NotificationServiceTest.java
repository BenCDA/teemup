package com.teemup.service;

import com.teemup.dto.notification.NotificationResponse;
import com.teemup.entity.Notification;
import com.teemup.entity.User;
import com.teemup.exception.NotificationException;
import com.teemup.repository.NotificationRepository;
import com.teemup.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Tests")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User recipient;
    private User fromUser;
    private UUID recipientId;
    private UUID fromUserId;
    private Notification notification;
    private UUID notificationId;

    @BeforeEach
    void setUp() {
        recipientId = UUID.randomUUID();
        fromUserId = UUID.randomUUID();
        notificationId = UUID.randomUUID();

        recipient = User.builder()
                .id(recipientId)
                .email("recipient@test.com")
                .firstName("John")
                .lastName("Doe")
                .password("encoded")
                .isActive(true)
                .isOnline(false)
                .isVerified(true)
                .build();

        fromUser = User.builder()
                .id(fromUserId)
                .email("sender@test.com")
                .firstName("Jane")
                .lastName("Smith")
                .password("encoded")
                .isActive(true)
                .isOnline(false)
                .isVerified(true)
                .build();

        notification = Notification.builder()
                .id(notificationId)
                .user(recipient)
                .fromUser(fromUser)
                .type(Notification.NotificationType.FRIEND_REQUEST)
                .title("Demande d'ami")
                .content("Jane veut etre votre ami")
                .referenceId("ref-123")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("createNotification")
    class CreateNotificationTests {

        @Test
        @DisplayName("Should create and return a notification")
        void shouldCreateNotification() {
            when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

            NotificationResponse result = notificationService.createNotification(
                    recipient, fromUser, Notification.NotificationType.FRIEND_REQUEST,
                    "Demande d'ami", "Jane veut etre votre ami", "ref-123"
            );

            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("Demande d'ami");
            assertThat(result.getType()).isEqualTo("FRIEND_REQUEST");
            verify(notificationRepository).save(any(Notification.class));
        }
    }

    @Nested
    @DisplayName("getUserNotifications")
    class GetUserNotificationsTests {

        @Test
        @DisplayName("Should return paginated notifications")
        void shouldReturnPaginatedNotifications() {
            Page<Notification> page = new PageImpl<>(List.of(notification));
            when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(recipientId), any(PageRequest.class)))
                    .thenReturn(page);

            Page<NotificationResponse> result = notificationService.getUserNotifications(recipientId, 0, 20);

            assertThat(result.getContent()).hasSize(1);
            verify(notificationRepository).findByUserIdOrderByCreatedAtDesc(eq(recipientId), any(PageRequest.class));
        }
    }

    @Nested
    @DisplayName("getUnreadNotifications")
    class GetUnreadNotificationsTests {

        @Test
        @DisplayName("Should return unread notifications")
        void shouldReturnUnreadNotifications() {
            when(notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(recipientId))
                    .thenReturn(List.of(notification));

            List<NotificationResponse> result = notificationService.getUnreadNotifications(recipientId);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getUnreadCount")
    class GetUnreadCountTests {

        @Test
        @DisplayName("Should return unread count")
        void shouldReturnUnreadCount() {
            when(notificationRepository.countByUserIdAndIsReadFalse(recipientId)).thenReturn(5L);

            Long count = notificationService.getUnreadCount(recipientId);

            assertThat(count).isEqualTo(5L);
        }
    }

    @Nested
    @DisplayName("markAsRead")
    class MarkAsReadTests {

        @Test
        @DisplayName("Should mark notification as read")
        void shouldMarkAsRead() {
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));
            when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

            NotificationResponse result = notificationService.markAsRead(notificationId, recipientId);

            assertThat(result).isNotNull();
            verify(notificationRepository).save(argThat(n -> n.getIsRead()));
        }

        @Test
        @DisplayName("Should throw when notification not found")
        void shouldThrowWhenNotFound() {
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.markAsRead(notificationId, recipientId))
                    .isInstanceOf(NotificationException.class);
        }

        @Test
        @DisplayName("Should throw when user is not the owner")
        void shouldThrowWhenUnauthorized() {
            UUID otherUserId = UUID.randomUUID();
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

            assertThatThrownBy(() -> notificationService.markAsRead(notificationId, otherUserId))
                    .isInstanceOf(NotificationException.class);
        }
    }

    @Nested
    @DisplayName("markAllAsRead")
    class MarkAllAsReadTests {

        @Test
        @DisplayName("Should call repository markAllAsRead")
        void shouldMarkAllAsRead() {
            notificationService.markAllAsRead(recipientId);

            verify(notificationRepository).markAllAsReadByUserId(recipientId);
        }
    }

    @Nested
    @DisplayName("deleteNotification")
    class DeleteNotificationTests {

        @Test
        @DisplayName("Should delete notification")
        void shouldDeleteNotification() {
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

            notificationService.deleteNotification(notificationId, recipientId);

            verify(notificationRepository).delete(notification);
        }

        @Test
        @DisplayName("Should throw when notification not found")
        void shouldThrowWhenNotFound() {
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.deleteNotification(notificationId, recipientId))
                    .isInstanceOf(NotificationException.class);
        }

        @Test
        @DisplayName("Should throw when user is not the owner")
        void shouldThrowWhenUnauthorized() {
            UUID otherUserId = UUID.randomUUID();
            when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

            assertThatThrownBy(() -> notificationService.deleteNotification(notificationId, otherUserId))
                    .isInstanceOf(NotificationException.class);
        }
    }
}

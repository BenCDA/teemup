package com.teemup.service;

import com.teemup.dto.moderation.ReportUserRequest;
import com.teemup.entity.User;
import com.teemup.exception.UserNotFoundException;
import com.teemup.repository.UserBlockRepository;
import com.teemup.repository.UserReportRepository;
import com.teemup.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ModerationService Tests")
class ModerationServiceTest {

    @Mock
    private UserReportRepository reportRepository;

    @Mock
    private UserBlockRepository blockRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ModerationService moderationService;

    private User user1;
    private User user2;
    private UUID userId1;
    private UUID userId2;

    @BeforeEach
    void setUp() {
        userId1 = UUID.randomUUID();
        userId2 = UUID.randomUUID();

        user1 = User.builder()
                .id(userId1).email("user1@test.com")
                .firstName("Alice").lastName("A").password("pwd")
                .isActive(true).isOnline(false).isVerified(true)
                .build();

        user2 = User.builder()
                .id(userId2).email("user2@test.com")
                .firstName("Bob").lastName("B").password("pwd")
                .isActive(true).isOnline(false).isVerified(true)
                .build();
    }

    @Nested
    @DisplayName("reportUser")
    class ReportUserTests {

        @Test
        @DisplayName("Should report user successfully")
        void shouldReportUser() {
            ReportUserRequest request = new ReportUserRequest("spam", "Sends spam messages");
            when(userRepository.findById(userId1)).thenReturn(Optional.of(user1));
            when(userRepository.findById(userId2)).thenReturn(Optional.of(user2));
            when(reportRepository.existsByReporterIdAndReportedUserId(userId1, userId2)).thenReturn(false);

            moderationService.reportUser(userId1, userId2, request);

            verify(reportRepository).save(any());
        }

        @Test
        @DisplayName("Should throw when reporting self")
        void shouldThrowWhenReportingSelf() {
            ReportUserRequest request = new ReportUserRequest("spam", null);

            assertThatThrownBy(() -> moderationService.reportUser(userId1, userId1, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("vous-m");
        }

        @Test
        @DisplayName("Should throw when reporter not found")
        void shouldThrowWhenReporterNotFound() {
            ReportUserRequest request = new ReportUserRequest("spam", null);
            when(userRepository.findById(userId1)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> moderationService.reportUser(userId1, userId2, request))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw when reported user not found")
        void shouldThrowWhenReportedNotFound() {
            ReportUserRequest request = new ReportUserRequest("spam", null);
            when(userRepository.findById(userId1)).thenReturn(Optional.of(user1));
            when(userRepository.findById(userId2)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> moderationService.reportUser(userId1, userId2, request))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw when duplicate report")
        void shouldThrowWhenDuplicateReport() {
            ReportUserRequest request = new ReportUserRequest("spam", null);
            when(userRepository.findById(userId1)).thenReturn(Optional.of(user1));
            when(userRepository.findById(userId2)).thenReturn(Optional.of(user2));
            when(reportRepository.existsByReporterIdAndReportedUserId(userId1, userId2)).thenReturn(true);

            assertThatThrownBy(() -> moderationService.reportUser(userId1, userId2, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("déjà");
        }
    }

    @Nested
    @DisplayName("blockUser")
    class BlockUserTests {

        @Test
        @DisplayName("Should block user successfully")
        void shouldBlockUser() {
            when(userRepository.findById(userId1)).thenReturn(Optional.of(user1));
            when(userRepository.findById(userId2)).thenReturn(Optional.of(user2));
            when(blockRepository.existsByBlockerIdAndBlockedUserId(userId1, userId2)).thenReturn(false);

            moderationService.blockUser(userId1, userId2);

            verify(blockRepository).save(any());
        }

        @Test
        @DisplayName("Should throw when blocking self")
        void shouldThrowWhenBlockingSelf() {
            assertThatThrownBy(() -> moderationService.blockUser(userId1, userId1))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("vous-m");
        }

        @Test
        @DisplayName("Should throw when already blocked")
        void shouldThrowWhenAlreadyBlocked() {
            when(userRepository.findById(userId1)).thenReturn(Optional.of(user1));
            when(userRepository.findById(userId2)).thenReturn(Optional.of(user2));
            when(blockRepository.existsByBlockerIdAndBlockedUserId(userId1, userId2)).thenReturn(true);

            assertThatThrownBy(() -> moderationService.blockUser(userId1, userId2))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("déjà");
        }

        @Test
        @DisplayName("Should throw when blocked user not found")
        void shouldThrowWhenBlockedUserNotFound() {
            when(userRepository.findById(userId1)).thenReturn(Optional.of(user1));
            when(userRepository.findById(userId2)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> moderationService.blockUser(userId1, userId2))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("unblockUser")
    class UnblockUserTests {

        @Test
        @DisplayName("Should unblock user successfully")
        void shouldUnblockUser() {
            when(blockRepository.existsByBlockerIdAndBlockedUserId(userId1, userId2)).thenReturn(true);

            moderationService.unblockUser(userId1, userId2);

            verify(blockRepository).deleteByBlockerIdAndBlockedUserId(userId1, userId2);
        }

        @Test
        @DisplayName("Should throw when user is not blocked")
        void shouldThrowWhenNotBlocked() {
            when(blockRepository.existsByBlockerIdAndBlockedUserId(userId1, userId2)).thenReturn(false);

            assertThatThrownBy(() -> moderationService.unblockUser(userId1, userId2))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("isBlocked")
    class IsBlockedTests {

        @Test
        @DisplayName("Should return true when user1 blocked user2")
        void shouldReturnTrueForward() {
            when(blockRepository.existsByBlockerIdAndBlockedUserId(userId1, userId2)).thenReturn(true);

            assertThat(moderationService.isBlocked(userId1, userId2)).isTrue();
        }

        @Test
        @DisplayName("Should return true when user2 blocked user1")
        void shouldReturnTrueReverse() {
            when(blockRepository.existsByBlockerIdAndBlockedUserId(userId1, userId2)).thenReturn(false);
            when(blockRepository.existsByBlockerIdAndBlockedUserId(userId2, userId1)).thenReturn(true);

            assertThat(moderationService.isBlocked(userId1, userId2)).isTrue();
        }

        @Test
        @DisplayName("Should return false when no block exists")
        void shouldReturnFalse() {
            when(blockRepository.existsByBlockerIdAndBlockedUserId(userId1, userId2)).thenReturn(false);
            when(blockRepository.existsByBlockerIdAndBlockedUserId(userId2, userId1)).thenReturn(false);

            assertThat(moderationService.isBlocked(userId1, userId2)).isFalse();
        }
    }

    @Nested
    @DisplayName("getBlockedUserIds")
    class GetBlockedUserIdsTests {

        @Test
        @DisplayName("Should return blocked user IDs")
        void shouldReturnBlockedIds() {
            when(blockRepository.findAllBlockRelatedUserIds(userId1)).thenReturn(List.of(userId2));

            List<UUID> result = moderationService.getBlockedUserIds(userId1);

            assertThat(result).containsExactly(userId2);
        }
    }
}

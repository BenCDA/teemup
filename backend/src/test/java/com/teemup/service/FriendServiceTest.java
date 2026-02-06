package com.teemup.service;

import com.teemup.dto.friend.FriendRequestResponse;
import com.teemup.entity.FriendRequest;
import com.teemup.entity.Notification;
import com.teemup.entity.User;
import com.teemup.exception.FriendRequestException;
import com.teemup.exception.UserNotFoundException;
import com.teemup.repository.FriendRequestRepository;
import com.teemup.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FriendService Tests")
class FriendServiceTest {

    @Mock
    private FriendRequestRepository friendRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FriendService friendService;

    private User sender;
    private User receiver;
    private UUID senderId;
    private UUID receiverId;
    private FriendRequest pendingRequest;

    @BeforeEach
    void setUp() {
        senderId = UUID.randomUUID();
        receiverId = UUID.randomUUID();

        sender = User.builder()
                .id(senderId)
                .email("sender@example.com")
                .password("password")
                .firstName("John")
                .lastName("Sender")
                .friends(new HashSet<>())
                .build();

        receiver = User.builder()
                .id(receiverId)
                .email("receiver@example.com")
                .password("password")
                .firstName("Jane")
                .lastName("Receiver")
                .friends(new HashSet<>())
                .build();

        pendingRequest = FriendRequest.builder()
                .id(UUID.randomUUID())
                .sender(sender)
                .receiver(receiver)
                .status(FriendRequest.FriendRequestStatus.PENDING)
                .build();
    }

    @Nested
    @DisplayName("Send Friend Request Tests")
    class SendFriendRequestTests {

        @Test
        @DisplayName("Should send friend request successfully")
        void shouldSendFriendRequestSuccessfully() {
            // Given
            when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
            when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));
            when(friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(
                    senderId, receiverId, FriendRequest.FriendRequestStatus.PENDING)).thenReturn(false);
            when(friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(
                    receiverId, senderId, FriendRequest.FriendRequestStatus.PENDING)).thenReturn(false);
            when(friendRequestRepository.save(any(FriendRequest.class))).thenReturn(pendingRequest);

            // When
            FriendRequestResponse response = friendService.sendFriendRequest(senderId, receiverId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo("PENDING");

            verify(friendRequestRepository).save(any(FriendRequest.class));
            verify(notificationService).createNotification(
                    eq(receiver),
                    eq(sender),
                    eq(Notification.NotificationType.FRIEND_REQUEST),
                    anyString(),
                    anyString(),
                    anyString()
            );
        }

        @Test
        @DisplayName("Should throw exception when sending request to self")
        void shouldThrowExceptionWhenSendingToSelf() {
            // When/Then
            assertThatThrownBy(() -> friendService.sendFriendRequest(senderId, senderId))
                    .isInstanceOf(FriendRequestException.class)
                    .hasMessage("Impossible d'envoyer une demande à vous-même");

            verify(userRepository, never()).findById(any());
        }

        @Test
        @DisplayName("Should throw exception when already friends")
        void shouldThrowExceptionWhenAlreadyFriends() {
            // Given
            sender.getFriends().add(receiver);
            when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
            when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));

            // When/Then
            assertThatThrownBy(() -> friendService.sendFriendRequest(senderId, receiverId))
                    .isInstanceOf(FriendRequestException.class)
                    .hasMessage("Vous êtes déjà amis avec cet utilisateur");

            verify(friendRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when request already pending")
        void shouldThrowExceptionWhenRequestAlreadyPending() {
            // Given
            when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
            when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));
            when(friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(
                    senderId, receiverId, FriendRequest.FriendRequestStatus.PENDING)).thenReturn(true);

            // When/Then
            assertThatThrownBy(() -> friendService.sendFriendRequest(senderId, receiverId))
                    .isInstanceOf(FriendRequestException.class)
                    .hasMessage("Demande d'ami déjà envoyée");

            verify(friendRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when reverse request exists")
        void shouldThrowExceptionWhenReverseRequestExists() {
            // Given
            when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
            when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));
            when(friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(
                    senderId, receiverId, FriendRequest.FriendRequestStatus.PENDING)).thenReturn(false);
            when(friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(
                    receiverId, senderId, FriendRequest.FriendRequestStatus.PENDING)).thenReturn(true);

            // When/Then
            assertThatThrownBy(() -> friendService.sendFriendRequest(senderId, receiverId))
                    .isInstanceOf(FriendRequestException.class)
                    .hasMessage("Cet utilisateur vous a déjà envoyé une demande");
        }

        @Test
        @DisplayName("Should throw exception when sender not found")
        void shouldThrowExceptionWhenSenderNotFound() {
            // Given
            when(userRepository.findById(senderId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> friendService.sendFriendRequest(senderId, receiverId))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when receiver not found")
        void shouldThrowExceptionWhenReceiverNotFound() {
            // Given
            when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
            when(userRepository.findById(receiverId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> friendService.sendFriendRequest(senderId, receiverId))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Accept Friend Request Tests")
    class AcceptFriendRequestTests {

        @Test
        @DisplayName("Should accept friend request successfully")
        void shouldAcceptFriendRequestSuccessfully() {
            // Given
            UUID requestId = pendingRequest.getId();
            when(friendRequestRepository.findById(requestId)).thenReturn(Optional.of(pendingRequest));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(friendRequestRepository.save(any(FriendRequest.class))).thenAnswer(invocation -> {
                FriendRequest req = invocation.getArgument(0);
                req.setStatus(FriendRequest.FriendRequestStatus.ACCEPTED);
                return req;
            });

            // When
            FriendRequestResponse response = friendService.acceptFriendRequest(requestId, receiverId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo("ACCEPTED");

            // Verify both users have each other as friends
            assertThat(sender.getFriends()).contains(receiver);
            assertThat(receiver.getFriends()).contains(sender);

            verify(userRepository, times(2)).save(any(User.class));
            verify(notificationService).createNotification(
                    eq(sender),
                    eq(receiver),
                    eq(Notification.NotificationType.FRIEND_REQUEST_ACCEPTED),
                    anyString(),
                    anyString(),
                    anyString()
            );
        }

        @Test
        @DisplayName("Should throw exception when not authorized to accept")
        void shouldThrowExceptionWhenNotAuthorizedToAccept() {
            // Given
            UUID requestId = pendingRequest.getId();
            UUID unauthorizedUserId = UUID.randomUUID();
            when(friendRequestRepository.findById(requestId)).thenReturn(Optional.of(pendingRequest));

            // When/Then
            assertThatThrownBy(() -> friendService.acceptFriendRequest(requestId, unauthorizedUserId))
                    .isInstanceOf(FriendRequestException.class)
                    .hasMessage("Non autorisé à effectuer cette action");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when request is not pending")
        void shouldThrowExceptionWhenRequestNotPending() {
            // Given
            pendingRequest.setStatus(FriendRequest.FriendRequestStatus.ACCEPTED);
            UUID requestId = pendingRequest.getId();
            when(friendRequestRepository.findById(requestId)).thenReturn(Optional.of(pendingRequest));

            // When/Then
            assertThatThrownBy(() -> friendService.acceptFriendRequest(requestId, receiverId))
                    .isInstanceOf(FriendRequestException.class)
                    .hasMessage("Cette demande n'est plus en attente");
        }

        @Test
        @DisplayName("Should throw exception when request not found")
        void shouldThrowExceptionWhenRequestNotFound() {
            // Given
            UUID unknownRequestId = UUID.randomUUID();
            when(friendRequestRepository.findById(unknownRequestId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> friendService.acceptFriendRequest(unknownRequestId, receiverId))
                    .isInstanceOf(FriendRequestException.class)
                    .hasMessage("Demande d'ami non trouvée");
        }
    }

    @Nested
    @DisplayName("Reject Friend Request Tests")
    class RejectFriendRequestTests {

        @Test
        @DisplayName("Should reject friend request successfully")
        void shouldRejectFriendRequestSuccessfully() {
            // Given
            UUID requestId = pendingRequest.getId();
            when(friendRequestRepository.findById(requestId)).thenReturn(Optional.of(pendingRequest));
            when(friendRequestRepository.save(any(FriendRequest.class))).thenAnswer(invocation -> {
                FriendRequest req = invocation.getArgument(0);
                return req;
            });

            // When
            FriendRequestResponse response = friendService.rejectFriendRequest(requestId, receiverId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo("REJECTED");

            verify(friendRequestRepository).save(argThat(req ->
                    req.getStatus() == FriendRequest.FriendRequestStatus.REJECTED
            ));
        }

        @Test
        @DisplayName("Should throw exception when not authorized to reject")
        void shouldThrowExceptionWhenNotAuthorizedToReject() {
            // Given
            UUID requestId = pendingRequest.getId();
            UUID unauthorizedUserId = UUID.randomUUID();
            when(friendRequestRepository.findById(requestId)).thenReturn(Optional.of(pendingRequest));

            // When/Then
            assertThatThrownBy(() -> friendService.rejectFriendRequest(requestId, unauthorizedUserId))
                    .isInstanceOf(FriendRequestException.class)
                    .hasMessage("Non autorisé à effectuer cette action");
        }
    }

    @Nested
    @DisplayName("Cancel Friend Request Tests")
    class CancelFriendRequestTests {

        @Test
        @DisplayName("Should cancel friend request successfully")
        void shouldCancelFriendRequestSuccessfully() {
            // Given
            UUID requestId = pendingRequest.getId();
            when(friendRequestRepository.findById(requestId)).thenReturn(Optional.of(pendingRequest));
            when(friendRequestRepository.save(any(FriendRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            friendService.cancelFriendRequest(requestId, senderId);

            // Then
            verify(friendRequestRepository).save(argThat(req ->
                    req.getStatus() == FriendRequest.FriendRequestStatus.CANCELLED
            ));
        }

        @Test
        @DisplayName("Should throw exception when not authorized to cancel")
        void shouldThrowExceptionWhenNotAuthorizedToCancel() {
            // Given
            UUID requestId = pendingRequest.getId();
            when(friendRequestRepository.findById(requestId)).thenReturn(Optional.of(pendingRequest));

            // When/Then - Receiver tries to cancel (only sender can cancel)
            assertThatThrownBy(() -> friendService.cancelFriendRequest(requestId, receiverId))
                    .isInstanceOf(FriendRequestException.class)
                    .hasMessage("Non autorisé à effectuer cette action");
        }
    }

    @Nested
    @DisplayName("Get Pending Requests Tests")
    class GetPendingRequestsTests {

        @Test
        @DisplayName("Should get pending received requests")
        void shouldGetPendingReceivedRequests() {
            // Given
            when(friendRequestRepository.findPendingRequestsByReceiverId(receiverId))
                    .thenReturn(List.of(pendingRequest));

            // When
            List<FriendRequestResponse> results = friendService.getPendingReceivedRequests(receiverId);

            // Then
            assertThat(results).hasSize(1);
            verify(friendRequestRepository).findPendingRequestsByReceiverId(receiverId);
        }

        @Test
        @DisplayName("Should get pending sent requests")
        void shouldGetPendingSentRequests() {
            // Given
            when(friendRequestRepository.findPendingRequestsBySenderId(senderId))
                    .thenReturn(List.of(pendingRequest));

            // When
            List<FriendRequestResponse> results = friendService.getPendingSentRequests(senderId);

            // Then
            assertThat(results).hasSize(1);
            verify(friendRequestRepository).findPendingRequestsBySenderId(senderId);
        }

        @Test
        @DisplayName("Should return empty list when no pending requests")
        void shouldReturnEmptyListWhenNoPendingRequests() {
            // Given
            when(friendRequestRepository.findPendingRequestsByReceiverId(receiverId))
                    .thenReturn(Collections.emptyList());

            // When
            List<FriendRequestResponse> results = friendService.getPendingReceivedRequests(receiverId);

            // Then
            assertThat(results).isEmpty();
        }
    }

    @Nested
    @DisplayName("Remove Friend Tests")
    class RemoveFriendTests {

        @Test
        @DisplayName("Should remove friend successfully")
        void shouldRemoveFriendSuccessfully() {
            // Given - Make them friends first
            sender.getFriends().add(receiver);
            receiver.getFriends().add(sender);

            when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
            when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            friendService.removeFriend(senderId, receiverId);

            // Then
            assertThat(sender.getFriends()).doesNotContain(receiver);
            assertThat(receiver.getFriends()).doesNotContain(sender);

            verify(userRepository, times(2)).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Given
            when(userRepository.findById(senderId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> friendService.removeFriend(senderId, receiverId))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when friend not found")
        void shouldThrowExceptionWhenFriendNotFound() {
            // Given
            when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
            when(userRepository.findById(receiverId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> friendService.removeFriend(senderId, receiverId))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }
}

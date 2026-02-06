package com.teemup.service;

import com.teemup.dto.friend.FriendRequestResponse;
import com.teemup.entity.FriendRequest;
import com.teemup.entity.Notification;
import com.teemup.entity.User;
import com.teemup.exception.FriendRequestException;
import com.teemup.exception.UserNotFoundException;
import com.teemup.repository.FriendRequestRepository;
import com.teemup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public FriendRequestResponse sendFriendRequest(UUID senderId, UUID receiverId) {
        if (senderId.equals(receiverId)) {
            throw FriendRequestException.cannotSendToSelf();
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new UserNotFoundException(senderId));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new UserNotFoundException(receiverId));

        // Check if already friends
        if (sender.getFriends().contains(receiver)) {
            throw FriendRequestException.alreadyFriends();
        }

        // Check for existing pending request
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(
                senderId, receiverId, FriendRequest.FriendRequestStatus.PENDING)) {
            throw FriendRequestException.alreadySent();
        }

        // Check for existing pending request in reverse
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(
                receiverId, senderId, FriendRequest.FriendRequestStatus.PENDING)) {
            throw FriendRequestException.alreadyReceived();
        }

        FriendRequest friendRequest = FriendRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .status(FriendRequest.FriendRequestStatus.PENDING)
                .build();

        friendRequest = friendRequestRepository.save(friendRequest);

        // Create notification
        notificationService.createNotification(
                receiver,
                sender,
                Notification.NotificationType.FRIEND_REQUEST,
                "New Friend Request",
                sender.getFullName() + " sent you a friend request",
                friendRequest.getId().toString()
        );

        return FriendRequestResponse.fromEntity(friendRequest);
    }

    @Transactional
    public FriendRequestResponse acceptFriendRequest(UUID requestId, UUID userId) {
        FriendRequest friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(FriendRequestException::notFound);

        if (!friendRequest.getReceiver().getId().equals(userId)) {
            throw FriendRequestException.unauthorized();
        }

        if (friendRequest.getStatus() != FriendRequest.FriendRequestStatus.PENDING) {
            throw FriendRequestException.notPending();
        }

        User sender = friendRequest.getSender();
        User receiver = friendRequest.getReceiver();

        // Add each other as friends
        sender.getFriends().add(receiver);
        receiver.getFriends().add(sender);

        userRepository.save(sender);
        userRepository.save(receiver);

        friendRequest.setStatus(FriendRequest.FriendRequestStatus.ACCEPTED);
        friendRequest = friendRequestRepository.save(friendRequest);

        // Create notification
        notificationService.createNotification(
                sender,
                receiver,
                Notification.NotificationType.FRIEND_REQUEST_ACCEPTED,
                "Friend Request Accepted",
                receiver.getFullName() + " accepted your friend request",
                friendRequest.getId().toString()
        );

        return FriendRequestResponse.fromEntity(friendRequest);
    }

    @Transactional
    public FriendRequestResponse rejectFriendRequest(UUID requestId, UUID userId) {
        FriendRequest friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(FriendRequestException::notFound);

        if (!friendRequest.getReceiver().getId().equals(userId)) {
            throw FriendRequestException.unauthorized();
        }

        if (friendRequest.getStatus() != FriendRequest.FriendRequestStatus.PENDING) {
            throw FriendRequestException.notPending();
        }

        friendRequest.setStatus(FriendRequest.FriendRequestStatus.REJECTED);
        friendRequest = friendRequestRepository.save(friendRequest);

        return FriendRequestResponse.fromEntity(friendRequest);
    }

    @Transactional
    public void cancelFriendRequest(UUID requestId, UUID userId) {
        FriendRequest friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(FriendRequestException::notFound);

        if (!friendRequest.getSender().getId().equals(userId)) {
            throw FriendRequestException.unauthorized();
        }

        if (friendRequest.getStatus() != FriendRequest.FriendRequestStatus.PENDING) {
            throw FriendRequestException.notPending();
        }

        friendRequest.setStatus(FriendRequest.FriendRequestStatus.CANCELLED);
        friendRequestRepository.save(friendRequest);
    }

    public List<FriendRequestResponse> getPendingReceivedRequests(UUID userId) {
        return friendRequestRepository.findPendingRequestsByReceiverId(userId).stream()
                .map(FriendRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FriendRequestResponse> getPendingSentRequests(UUID userId) {
        return friendRequestRepository.findPendingRequestsBySenderId(userId).stream()
                .map(FriendRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeFriend(UUID userId, UUID friendId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new UserNotFoundException(friendId));

        user.getFriends().remove(friend);
        friend.getFriends().remove(user);

        userRepository.save(user);
        userRepository.save(friend);
    }
}

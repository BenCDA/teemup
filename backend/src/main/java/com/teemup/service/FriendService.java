package com.teemup.service;

import com.teemup.dto.friend.FriendRequestResponse;
import com.teemup.entity.FriendRequest;
import com.teemup.entity.Notification;
import com.teemup.entity.User;
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
            throw new RuntimeException("Cannot send friend request to yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        // Check if already friends
        if (sender.getFriends().contains(receiver)) {
            throw new RuntimeException("Already friends with this user");
        }

        // Check for existing pending request
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(
                senderId, receiverId, FriendRequest.FriendRequestStatus.PENDING)) {
            throw new RuntimeException("Friend request already sent");
        }

        // Check for existing pending request in reverse
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(
                receiverId, senderId, FriendRequest.FriendRequestStatus.PENDING)) {
            throw new RuntimeException("This user has already sent you a friend request");
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
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (!friendRequest.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to accept this request");
        }

        if (friendRequest.getStatus() != FriendRequest.FriendRequestStatus.PENDING) {
            throw new RuntimeException("Friend request is not pending");
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
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (!friendRequest.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to reject this request");
        }

        if (friendRequest.getStatus() != FriendRequest.FriendRequestStatus.PENDING) {
            throw new RuntimeException("Friend request is not pending");
        }

        friendRequest.setStatus(FriendRequest.FriendRequestStatus.REJECTED);
        friendRequest = friendRequestRepository.save(friendRequest);

        return FriendRequestResponse.fromEntity(friendRequest);
    }

    @Transactional
    public void cancelFriendRequest(UUID requestId, UUID userId) {
        FriendRequest friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (!friendRequest.getSender().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to cancel this request");
        }

        if (friendRequest.getStatus() != FriendRequest.FriendRequestStatus.PENDING) {
            throw new RuntimeException("Friend request is not pending");
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
                .orElseThrow(() -> new RuntimeException("User not found"));

        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Friend not found"));

        user.getFriends().remove(friend);
        friend.getFriends().remove(user);

        userRepository.save(user);
        userRepository.save(friend);
    }
}

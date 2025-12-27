package com.teemup.controller;

import com.teemup.dto.friend.FriendRequestResponse;
import com.teemup.security.UserDetailsImpl;
import com.teemup.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @PostMapping("/request/{receiverId}")
    public ResponseEntity<FriendRequestResponse> sendFriendRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID receiverId
    ) {
        return ResponseEntity.ok(friendService.sendFriendRequest(userDetails.getId(), receiverId));
    }

    @PostMapping("/accept/{requestId}")
    public ResponseEntity<FriendRequestResponse> acceptFriendRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID requestId
    ) {
        return ResponseEntity.ok(friendService.acceptFriendRequest(requestId, userDetails.getId()));
    }

    @PostMapping("/reject/{requestId}")
    public ResponseEntity<FriendRequestResponse> rejectFriendRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID requestId
    ) {
        return ResponseEntity.ok(friendService.rejectFriendRequest(requestId, userDetails.getId()));
    }

    @DeleteMapping("/cancel/{requestId}")
    public ResponseEntity<Map<String, String>> cancelFriendRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID requestId
    ) {
        friendService.cancelFriendRequest(requestId, userDetails.getId());
        return ResponseEntity.ok(Map.of("message", "Friend request cancelled"));
    }

    @GetMapping("/requests/received")
    public ResponseEntity<List<FriendRequestResponse>> getPendingReceivedRequests(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(friendService.getPendingReceivedRequests(userDetails.getId()));
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<List<FriendRequestResponse>> getPendingSentRequests(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(friendService.getPendingSentRequests(userDetails.getId()));
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Map<String, String>> removeFriend(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID friendId
    ) {
        friendService.removeFriend(userDetails.getId(), friendId);
        return ResponseEntity.ok(Map.of("message", "Friend removed"));
    }
}

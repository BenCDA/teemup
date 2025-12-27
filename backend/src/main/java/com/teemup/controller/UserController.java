package com.teemup.controller;

import com.teemup.dto.user.UpdateUserRequest;
import com.teemup.dto.user.UserResponse;
import com.teemup.security.UserDetailsImpl;
import com.teemup.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(userService.updateUser(userDetails.getId(), request));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }

    @GetMapping("/discover")
    public ResponseEntity<List<UserResponse>> getDiscoverUsers(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(userService.getDiscoverUsers(userDetails.getId()));
    }

    @GetMapping("/friends")
    public ResponseEntity<List<UserResponse>> getCurrentUserFriends(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(userService.getUserFriends(userDetails.getId()));
    }

    @GetMapping("/{userId}/friends")
    public ResponseEntity<List<UserResponse>> getUserFriends(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserFriends(userId));
    }
}

package com.teemup.controller;

import com.teemup.dto.moderation.ReportUserRequest;
import com.teemup.dto.user.UserResponse;
import com.teemup.security.UserDetailsImpl;
import com.teemup.service.ModerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/moderation")
@RequiredArgsConstructor
public class ModerationController {

    private final ModerationService moderationService;

    @PostMapping("/report/{userId}")
    public ResponseEntity<Map<String, String>> reportUser(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID userId,
            @Valid @RequestBody ReportUserRequest request
    ) {
        moderationService.reportUser(userDetails.getId(), userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Utilisateur signalé avec succès"));
    }

    @PostMapping("/block/{userId}")
    public ResponseEntity<Map<String, String>> blockUser(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID userId
    ) {
        moderationService.blockUser(userDetails.getId(), userId);
        return ResponseEntity.ok(Map.of("message", "Utilisateur bloqué"));
    }

    @DeleteMapping("/block/{userId}")
    public ResponseEntity<Map<String, String>> unblockUser(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID userId
    ) {
        moderationService.unblockUser(userDetails.getId(), userId);
        return ResponseEntity.ok(Map.of("message", "Utilisateur débloqué"));
    }

    @GetMapping("/blocked")
    public ResponseEntity<List<UserResponse>> getBlockedUsers(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(moderationService.getBlockedUsers(userDetails.getId()));
    }
}

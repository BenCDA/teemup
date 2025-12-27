package com.teemup.controller;

import com.teemup.dto.notification.NotificationResponse;
import com.teemup.security.UserDetailsImpl;
import com.teemup.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getUserNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userDetails.getId(), page, size));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(userDetails.getId()));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userDetails.getId())));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID notificationId
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(notificationId, userDetails.getId()));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        notificationService.markAllAsRead(userDetails.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID notificationId
    ) {
        notificationService.deleteNotification(notificationId, userDetails.getId());
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }
}

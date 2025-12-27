package com.teemup.controller;

import com.teemup.dto.messaging.*;
import com.teemup.security.UserDetailsImpl;
import com.teemup.service.MessagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/messaging")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;

    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponse> createConversation(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ConversationRequest request
    ) {
        return ResponseEntity.ok(messagingService.createConversation(userDetails.getId(), request));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getUserConversations(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(messagingService.getUserConversations(userDetails.getId()));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationResponse> getConversation(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID conversationId
    ) {
        return ResponseEntity.ok(messagingService.getConversation(conversationId, userDetails.getId()));
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody MessageRequest request
    ) {
        return ResponseEntity.ok(messagingService.sendMessage(userDetails.getId(), request));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(messagingService.getMessages(conversationId, userDetails.getId(), page, size));
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<MessageResponse> editMessage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID messageId,
            @RequestBody Map<String, String> request
    ) {
        return ResponseEntity.ok(messagingService.editMessage(messageId, userDetails.getId(), request.get("content")));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Map<String, String>> deleteMessage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID messageId
    ) {
        messagingService.deleteMessage(messageId, userDetails.getId());
        return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID conversationId
    ) {
        messagingService.markMessagesAsRead(conversationId, userDetails.getId());
        return ResponseEntity.ok(Map.of("message", "Messages marked as read"));
    }
}

package com.teemup.websocket;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.teemup.dto.messaging.MessageResponse;
import com.teemup.entity.User;
import com.teemup.security.JwtService;
import com.teemup.service.MessagingService;
import com.teemup.service.UserService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocketIOService {

    private final SocketIOServer socketIOServer;
    private final JwtService jwtService;
    private final UserService userService;
    private final MessagingService messagingService;

    private final Map<UUID, SocketIOClient> connectedUsers = new ConcurrentHashMap<>();
    private final Map<String, UUID> sessionToUser = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        socketIOServer.addConnectListener(this::onConnect);
        socketIOServer.addDisconnectListener(this::onDisconnect);

        socketIOServer.addEventListener("joinConversation", String.class, this::onJoinConversation);
        socketIOServer.addEventListener("leaveConversation", String.class, this::onLeaveConversation);
        socketIOServer.addEventListener("sendMessage", Map.class, this::onSendMessage);
        socketIOServer.addEventListener("typing", Map.class, this::onTyping);
        socketIOServer.addEventListener("stopTyping", Map.class, this::onStopTyping);
        socketIOServer.addEventListener("markRead", Map.class, this::onMarkRead);

        socketIOServer.start();
        log.info("Socket.IO server started on port {}", socketIOServer.getConfiguration().getPort());
    }

    private void onConnect(SocketIOClient client) {
        String token = client.getHandshakeData().getSingleUrlParam("token");
        if (token == null) {
            token = client.getHandshakeData().getHttpHeaders().get("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
        }

        if (token == null || token.isEmpty()) {
            log.warn("Connection attempt without token");
            client.disconnect();
            return;
        }

        try {
            String email = jwtService.extractUsername(token);
            User user = userService.findByEmail(email);
            UUID userId = user.getId();

            connectedUsers.put(userId, client);
            sessionToUser.put(client.getSessionId().toString(), userId);

            userService.setUserOnlineStatus(userId, true);

            client.sendEvent("connected", Map.of("userId", userId.toString()));
            broadcastUserStatus(userId, true);

            log.info("User {} connected", userId);
        } catch (Exception e) {
            log.error("Authentication failed: {}", e.getMessage());
            client.disconnect();
        }
    }

    private void onDisconnect(SocketIOClient client) {
        UUID userId = sessionToUser.remove(client.getSessionId().toString());
        if (userId != null) {
            connectedUsers.remove(userId);
            userService.setUserOnlineStatus(userId, false);
            broadcastUserStatus(userId, false);
            log.info("User {} disconnected", userId);
        }
    }

    private void onJoinConversation(SocketIOClient client, String conversationId, com.corundumstudio.socketio.AckRequest ackRequest) {
        String room = "conversation-" + conversationId;
        client.joinRoom(room);
        log.debug("Client joined room: {}", room);
    }

    private void onLeaveConversation(SocketIOClient client, String conversationId, com.corundumstudio.socketio.AckRequest ackRequest) {
        String room = "conversation-" + conversationId;
        client.leaveRoom(room);
        log.debug("Client left room: {}", room);
    }

    @SuppressWarnings("unchecked")
    private void onSendMessage(SocketIOClient client, Map<String, Object> data, com.corundumstudio.socketio.AckRequest ackRequest) {
        UUID userId = sessionToUser.get(client.getSessionId().toString());
        if (userId == null) {
            client.sendEvent("error", Map.of("message", "Not authenticated"));
            return;
        }

        try {
            String conversationId = (String) data.get("conversationId");
            String content = (String) data.get("content");

            com.teemup.dto.messaging.MessageRequest request = new com.teemup.dto.messaging.MessageRequest();
            request.setConversationId(UUID.fromString(conversationId));
            request.setContent(content);

            MessageResponse message = messagingService.sendMessage(userId, request);

            String room = "conversation-" + conversationId;
            socketIOServer.getRoomOperations(room).sendEvent("newMessage", message);

            log.debug("Message sent to room: {}", room);
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage());
            client.sendEvent("error", Map.of("message", "Failed to send message"));
        }
    }

    @SuppressWarnings("unchecked")
    private void onTyping(SocketIOClient client, Map<String, Object> data, com.corundumstudio.socketio.AckRequest ackRequest) {
        UUID userId = sessionToUser.get(client.getSessionId().toString());
        if (userId == null) return;

        String conversationId = (String) data.get("conversationId");
        String room = "conversation-" + conversationId;

        socketIOServer.getRoomOperations(room).sendEvent("userTyping", Map.of(
                "userId", userId.toString(),
                "conversationId", conversationId
        ));
    }

    @SuppressWarnings("unchecked")
    private void onStopTyping(SocketIOClient client, Map<String, Object> data, com.corundumstudio.socketio.AckRequest ackRequest) {
        UUID userId = sessionToUser.get(client.getSessionId().toString());
        if (userId == null) return;

        String conversationId = (String) data.get("conversationId");
        String room = "conversation-" + conversationId;

        socketIOServer.getRoomOperations(room).sendEvent("userStoppedTyping", Map.of(
                "userId", userId.toString(),
                "conversationId", conversationId
        ));
    }

    @SuppressWarnings("unchecked")
    private void onMarkRead(SocketIOClient client, Map<String, Object> data, com.corundumstudio.socketio.AckRequest ackRequest) {
        UUID userId = sessionToUser.get(client.getSessionId().toString());
        if (userId == null) return;

        String conversationId = (String) data.get("conversationId");

        messagingService.markMessagesAsRead(UUID.fromString(conversationId), userId);

        String room = "conversation-" + conversationId;
        socketIOServer.getRoomOperations(room).sendEvent("messagesRead", Map.of(
                "userId", userId.toString(),
                "conversationId", conversationId
        ));
    }

    private void broadcastUserStatus(UUID userId, boolean isOnline) {
        socketIOServer.getBroadcastOperations().sendEvent(
                isOnline ? "userOnline" : "userOffline",
                Map.of("userId", userId.toString())
        );
    }

    public void sendNotificationToUser(UUID userId, Object notification) {
        SocketIOClient client = connectedUsers.get(userId);
        if (client != null && client.isChannelOpen()) {
            client.sendEvent("notification", notification);
        }
    }

    public void broadcastToConversation(String conversationId, String event, Object data) {
        String room = "conversation-" + conversationId;
        socketIOServer.getRoomOperations(room).sendEvent(event, data);
    }

    public boolean isUserOnline(UUID userId) {
        return connectedUsers.containsKey(userId);
    }
}

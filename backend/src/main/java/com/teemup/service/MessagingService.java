package com.teemup.service;

import com.teemup.dto.messaging.*;
import com.teemup.entity.Conversation;
import com.teemup.entity.Message;
import com.teemup.entity.User;
import com.teemup.repository.ConversationRepository;
import com.teemup.repository.MessageRepository;
import com.teemup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public synchronized ConversationResponse createConversation(UUID creatorId, ConversationRequest request) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<User> participants = new HashSet<>();
        participants.add(creator);

        for (UUID participantId : request.getParticipantIds()) {
            User participant = userRepository.findById(participantId)
                    .orElseThrow(() -> new RuntimeException("Participant not found: " + participantId));

            // Verify users are friends before allowing conversation creation
            if (!creator.getFriends().contains(participant)) {
                throw new RuntimeException("You can only message friends. Send a friend request first to: " + participant.getFullName());
            }

            participants.add(participant);
        }

        // Check for existing private conversation (synchronized to prevent race condition)
        if (participants.size() == 2 && (request.getType() == null || "PRIVATE".equals(request.getType()))) {
            UUID otherUserId = request.getParticipantIds().iterator().next();
            Optional<Conversation> existingConversation = conversationRepository.findPrivateConversation(creatorId, otherUserId);
            if (existingConversation.isPresent()) {
                return ConversationResponse.fromEntity(existingConversation.get());
            }
        }

        Conversation.ConversationType type = participants.size() > 2
                ? Conversation.ConversationType.GROUP
                : Conversation.ConversationType.PRIVATE;

        if (request.getType() != null) {
            type = Conversation.ConversationType.valueOf(request.getType());
        }

        Conversation conversation = Conversation.builder()
                .name(request.getName())
                .type(type)
                .participants(participants)
                .createdBy(creator)
                .build();

        conversation = conversationRepository.save(conversation);
        return ConversationResponse.fromEntity(conversation);
    }

    public List<ConversationResponse> getUserConversations(UUID userId) {
        List<Conversation> conversations = conversationRepository.findByParticipantId(userId);

        return conversations.stream()
                .map(conv -> {
                    Page<Message> lastMessages = messageRepository.findByConversationId(
                            conv.getId(),
                            PageRequest.of(0, 1)
                    );
                    MessageResponse lastMessage = lastMessages.hasContent()
                            ? MessageResponse.fromEntity(lastMessages.getContent().get(0))
                            : null;

                    Long unreadCount = messageRepository.countUnreadMessages(conv.getId(), userId);

                    return ConversationResponse.fromEntityWithDetails(conv, lastMessage, unreadCount);
                })
                .collect(Collectors.toList());
    }

    public ConversationResponse getConversation(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(userId));

        if (!isParticipant) {
            throw new RuntimeException("User is not a participant of this conversation");
        }

        Page<Message> lastMessages = messageRepository.findByConversationId(
                conversationId,
                PageRequest.of(0, 1)
        );
        MessageResponse lastMessage = lastMessages.hasContent()
                ? MessageResponse.fromEntity(lastMessages.getContent().get(0))
                : null;

        Long unreadCount = messageRepository.countUnreadMessages(conversationId, userId);

        return ConversationResponse.fromEntityWithDetails(conversation, lastMessage, unreadCount);
    }

    @Transactional
    public MessageResponse sendMessage(UUID senderId, MessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        Conversation conversation = conversationRepository.findByIdWithParticipants(request.getConversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Verify user is a participant of the conversation
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(senderId));
        if (!isParticipant) {
            throw new RuntimeException("User is not a participant of this conversation");
        }

        Message.MessageType type = Message.MessageType.TEXT;
        if (request.getType() != null) {
            type = Message.MessageType.valueOf(request.getType());
        }

        Message message = Message.builder()
                .content(request.getContent())
                .sender(sender)
                .conversation(conversation)
                .type(type)
                .readBy(new HashSet<>(Set.of(senderId)))
                .build();

        message = messageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return MessageResponse.fromEntity(message);
    }

    public Page<MessageResponse> getMessages(UUID conversationId, UUID userId, int page, int size) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(userId));

        if (!isParticipant) {
            throw new RuntimeException("User is not a participant of this conversation");
        }

        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findByConversationId(conversationId, pageable)
                .map(MessageResponse::fromEntity);
    }

    @Transactional
    public MessageResponse editMessage(UUID messageId, UUID userId, String newContent) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Only the sender can edit the message");
        }

        message.setContent(newContent);
        message.setIsEdited(true);
        message = messageRepository.save(message);

        return MessageResponse.fromEntity(message);
    }

    @Transactional
    public void deleteMessage(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Only the sender can delete the message");
        }

        message.setIsDeleted(true);
        message.setContent("[Message deleted]");
        messageRepository.save(message);
    }

    @Transactional
    public void markMessagesAsRead(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Verify user is a participant of the conversation
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(userId));
        if (!isParticipant) {
            throw new RuntimeException("User is not a participant of this conversation");
        }

        List<Message> unreadMessages = messageRepository.findUnreadMessages(conversationId, userId);
        for (Message message : unreadMessages) {
            message.markAsRead(userId);
        }
        messageRepository.saveAll(unreadMessages);
    }

    public Optional<Conversation> findPrivateConversation(UUID user1Id, UUID user2Id) {
        return conversationRepository.findPrivateConversation(user1Id, user2Id);
    }
}

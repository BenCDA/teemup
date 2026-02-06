package com.teemup.service;

import com.teemup.dto.messaging.*;
import com.teemup.entity.Conversation;
import com.teemup.entity.Message;
import com.teemup.entity.User;
import com.teemup.exception.ConversationException;
import com.teemup.exception.UserNotFoundException;
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
    public ConversationResponse createConversation(UUID creatorId, ConversationRequest request) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new UserNotFoundException(creatorId));

        Set<User> participants = new HashSet<>();
        participants.add(creator);

        for (UUID participantId : request.getParticipantIds()) {
            User participant = userRepository.findById(participantId)
                    .orElseThrow(() -> new UserNotFoundException(participantId));

            // Verify users are friends before allowing conversation creation
            if (!creator.getFriends().contains(participant)) {
                throw ConversationException.mustBeFriends(participant.getFullName());
            }

            participants.add(participant);
        }

        // For private conversations, check if one already exists
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

        // Generate participant key for private conversations (for unique constraint)
        String privateParticipantKey = null;
        if (type == Conversation.ConversationType.PRIVATE && participants.size() == 2) {
            List<UUID> sortedIds = participants.stream()
                    .map(User::getId)
                    .sorted()
                    .collect(Collectors.toList());
            privateParticipantKey = sortedIds.stream()
                    .map(UUID::toString)
                    .collect(Collectors.joining(","));
        }

        Conversation conversation = Conversation.builder()
                .name(request.getName())
                .type(type)
                .participants(participants)
                .createdBy(creator)
                .privateParticipantKey(privateParticipantKey)
                .build();

        try {
            conversation = conversationRepository.save(conversation);
            return ConversationResponse.fromEntity(conversation);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Race condition: another thread created the conversation, fetch and return it
            if (participants.size() == 2 && type == Conversation.ConversationType.PRIVATE) {
                UUID otherUserId = request.getParticipantIds().iterator().next();
                return conversationRepository.findPrivateConversation(creatorId, otherUserId)
                        .map(ConversationResponse::fromEntity)
                        .orElseThrow(ConversationException::creationFailed);
            }
            throw e;
        }
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
                .orElseThrow(ConversationException::notFound);

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(userId));

        if (!isParticipant) {
            throw ConversationException.notParticipant();
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
                .orElseThrow(() -> new UserNotFoundException(senderId));

        Conversation conversation = conversationRepository.findByIdWithParticipants(request.getConversationId())
                .orElseThrow(ConversationException::notFound);

        // Verify user is a participant of the conversation
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(senderId));
        if (!isParticipant) {
            throw ConversationException.notParticipant();
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
                .orElseThrow(ConversationException::notFound);

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(userId));

        if (!isParticipant) {
            throw ConversationException.notParticipant();
        }

        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findByConversationId(conversationId, pageable)
                .map(MessageResponse::fromEntity);
    }

    @Transactional
    public MessageResponse editMessage(UUID messageId, UUID userId, String newContent) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(ConversationException::messageNotFound);

        if (!message.getSender().getId().equals(userId)) {
            throw ConversationException.notMessageSender();
        }

        message.setContent(newContent);
        message.setIsEdited(true);
        message = messageRepository.save(message);

        return MessageResponse.fromEntity(message);
    }

    @Transactional
    public void deleteMessage(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(ConversationException::messageNotFound);

        if (!message.getSender().getId().equals(userId)) {
            throw ConversationException.notMessageSender();
        }

        message.setIsDeleted(true);
        message.setContent("[Message deleted]");
        messageRepository.save(message);
    }

    @Transactional
    public void markMessagesAsRead(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
                .orElseThrow(ConversationException::notFound);

        // Verify user is a participant of the conversation
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getId().equals(userId));
        if (!isParticipant) {
            throw ConversationException.notParticipant();
        }

        // Use batch update to mark all unread messages as read in a single query
        messageRepository.markAllAsReadBatch(conversationId, userId);
    }

    public Optional<Conversation> findPrivateConversation(UUID user1Id, UUID user2Id) {
        return conversationRepository.findPrivateConversation(user1Id, user2Id);
    }
}

package com.teemup.service;

import com.teemup.dto.messaging.ConversationRequest;
import com.teemup.dto.messaging.ConversationResponse;
import com.teemup.dto.messaging.MessageRequest;
import com.teemup.dto.messaging.MessageResponse;
import com.teemup.entity.Conversation;
import com.teemup.entity.Message;
import com.teemup.entity.User;
import com.teemup.repository.ConversationRepository;
import com.teemup.repository.MessageRepository;
import com.teemup.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MessagingService Tests")
class MessagingServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MessagingService messagingService;

    private User user1;
    private User user2;
    private User user3;
    private UUID user1Id;
    private UUID user2Id;
    private UUID user3Id;
    private Conversation privateConversation;
    private Message testMessage;

    @BeforeEach
    void setUp() {
        user1Id = UUID.randomUUID();
        user2Id = UUID.randomUUID();
        user3Id = UUID.randomUUID();

        user1 = User.builder()
                .id(user1Id)
                .email("user1@example.com")
                .password("password")
                .firstName("User")
                .lastName("One")
                .friends(new HashSet<>())
                .build();

        user2 = User.builder()
                .id(user2Id)
                .email("user2@example.com")
                .password("password")
                .firstName("User")
                .lastName("Two")
                .friends(new HashSet<>())
                .build();

        user3 = User.builder()
                .id(user3Id)
                .email("user3@example.com")
                .password("password")
                .firstName("User")
                .lastName("Three")
                .friends(new HashSet<>())
                .build();

        // Make user1 and user2 friends
        user1.getFriends().add(user2);
        user2.getFriends().add(user1);

        privateConversation = Conversation.builder()
                .id(UUID.randomUUID())
                .type(Conversation.ConversationType.PRIVATE)
                .participants(new HashSet<>(Set.of(user1, user2)))
                .createdBy(user1)
                .lastMessageAt(LocalDateTime.now())
                .build();

        testMessage = Message.builder()
                .id(UUID.randomUUID())
                .content("Test message")
                .sender(user1)
                .conversation(privateConversation)
                .type(Message.MessageType.TEXT)
                .readBy(new HashSet<>(Set.of(user1Id)))
                .isEdited(false)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("Create Conversation Tests")
    class CreateConversationTests {

        @Test
        @DisplayName("Should create private conversation successfully")
        void shouldCreatePrivateConversationSuccessfully() {
            // Given
            ConversationRequest request = new ConversationRequest();
            request.setParticipantIds(Set.of(user2Id));

            when(userRepository.findById(user1Id)).thenReturn(Optional.of(user1));
            when(userRepository.findById(user2Id)).thenReturn(Optional.of(user2));
            when(conversationRepository.findPrivateConversation(user1Id, user2Id)).thenReturn(Optional.empty());
            when(conversationRepository.save(any(Conversation.class))).thenAnswer(invocation -> {
                Conversation conv = invocation.getArgument(0);
                conv.setId(UUID.randomUUID());
                return conv;
            });

            // When
            ConversationResponse response = messagingService.createConversation(user1Id, request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getType()).isEqualTo("PRIVATE");

            verify(conversationRepository).save(any(Conversation.class));
        }

        @Test
        @DisplayName("Should return existing conversation if already exists")
        void shouldReturnExistingConversation() {
            // Given
            ConversationRequest request = new ConversationRequest();
            request.setParticipantIds(Set.of(user2Id));

            when(userRepository.findById(user1Id)).thenReturn(Optional.of(user1));
            when(userRepository.findById(user2Id)).thenReturn(Optional.of(user2));
            when(conversationRepository.findPrivateConversation(user1Id, user2Id))
                    .thenReturn(Optional.of(privateConversation));

            // When
            ConversationResponse response = messagingService.createConversation(user1Id, request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(privateConversation.getId());

            verify(conversationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when trying to message non-friend")
        void shouldThrowExceptionWhenMessagingNonFriend() {
            // Given
            ConversationRequest request = new ConversationRequest();
            request.setParticipantIds(Set.of(user3Id)); // user3 is not a friend of user1

            when(userRepository.findById(user1Id)).thenReturn(Optional.of(user1));
            when(userRepository.findById(user3Id)).thenReturn(Optional.of(user3));

            // When/Then
            assertThatThrownBy(() -> messagingService.createConversation(user1Id, request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("only message friends");

            verify(conversationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when creator not found")
        void shouldThrowExceptionWhenCreatorNotFound() {
            // Given
            ConversationRequest request = new ConversationRequest();
            request.setParticipantIds(Set.of(user2Id));

            when(userRepository.findById(user1Id)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> messagingService.createConversation(user1Id, request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User not found");
        }
    }

    @Nested
    @DisplayName("Get Conversations Tests")
    class GetConversationsTests {

        @Test
        @DisplayName("Should get user conversations")
        void shouldGetUserConversations() {
            // Given
            when(conversationRepository.findByParticipantId(user1Id))
                    .thenReturn(List.of(privateConversation));
            when(messageRepository.findByConversationId(any(UUID.class), any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(testMessage)));
            when(messageRepository.countUnreadMessages(any(UUID.class), eq(user1Id)))
                    .thenReturn(0L);

            // When
            List<ConversationResponse> results = messagingService.getUserConversations(user1Id);

            // Then
            assertThat(results).hasSize(1);
            verify(conversationRepository).findByParticipantId(user1Id);
        }

        @Test
        @DisplayName("Should return empty list when no conversations")
        void shouldReturnEmptyListWhenNoConversations() {
            // Given
            when(conversationRepository.findByParticipantId(user1Id))
                    .thenReturn(Collections.emptyList());

            // When
            List<ConversationResponse> results = messagingService.getUserConversations(user1Id);

            // Then
            assertThat(results).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Single Conversation Tests")
    class GetSingleConversationTests {

        @Test
        @DisplayName("Should get conversation when user is participant")
        void shouldGetConversationWhenParticipant() {
            // Given
            UUID conversationId = privateConversation.getId();
            when(conversationRepository.findByIdWithParticipants(conversationId))
                    .thenReturn(Optional.of(privateConversation));
            when(messageRepository.findByConversationId(any(UUID.class), any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(Collections.emptyList()));
            when(messageRepository.countUnreadMessages(conversationId, user1Id)).thenReturn(0L);

            // When
            ConversationResponse response = messagingService.getConversation(conversationId, user1Id);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(conversationId);
        }

        @Test
        @DisplayName("Should throw exception when user is not participant")
        void shouldThrowExceptionWhenNotParticipant() {
            // Given
            UUID conversationId = privateConversation.getId();
            when(conversationRepository.findByIdWithParticipants(conversationId))
                    .thenReturn(Optional.of(privateConversation));

            // When/Then - user3 is not a participant
            assertThatThrownBy(() -> messagingService.getConversation(conversationId, user3Id))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User is not a participant of this conversation");
        }

        @Test
        @DisplayName("Should throw exception when conversation not found")
        void shouldThrowExceptionWhenConversationNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(conversationRepository.findByIdWithParticipants(unknownId))
                    .thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> messagingService.getConversation(unknownId, user1Id))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Conversation not found");
        }
    }

    @Nested
    @DisplayName("Send Message Tests")
    class SendMessageTests {

        @Test
        @DisplayName("Should send message successfully")
        void shouldSendMessageSuccessfully() {
            // Given
            MessageRequest request = new MessageRequest();
            request.setConversationId(privateConversation.getId());
            request.setContent("Hello, World!");

            when(userRepository.findById(user1Id)).thenReturn(Optional.of(user1));
            when(conversationRepository.findByIdWithParticipants(privateConversation.getId()))
                    .thenReturn(Optional.of(privateConversation));
            when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
                Message msg = invocation.getArgument(0);
                msg.setId(UUID.randomUUID());
                msg.setCreatedAt(LocalDateTime.now());
                return msg;
            });
            when(conversationRepository.save(any(Conversation.class)))
                    .thenReturn(privateConversation);

            // When
            MessageResponse response = messagingService.sendMessage(user1Id, request);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getContent()).isEqualTo("Hello, World!");

            verify(messageRepository).save(any(Message.class));
            verify(conversationRepository).save(any(Conversation.class));
        }

        @Test
        @DisplayName("Should throw exception when sender not found")
        void shouldThrowExceptionWhenSenderNotFound() {
            // Given
            MessageRequest request = new MessageRequest();
            request.setConversationId(privateConversation.getId());
            request.setContent("Hello");

            when(userRepository.findById(user1Id)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> messagingService.sendMessage(user1Id, request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Sender not found");
        }

        @Test
        @DisplayName("Should throw exception when sender not participant")
        void shouldThrowExceptionWhenSenderNotParticipant() {
            // Given
            MessageRequest request = new MessageRequest();
            request.setConversationId(privateConversation.getId());
            request.setContent("Hello");

            when(userRepository.findById(user3Id)).thenReturn(Optional.of(user3));
            when(conversationRepository.findByIdWithParticipants(privateConversation.getId()))
                    .thenReturn(Optional.of(privateConversation));

            // When/Then
            assertThatThrownBy(() -> messagingService.sendMessage(user3Id, request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User is not a participant of this conversation");
        }
    }

    @Nested
    @DisplayName("Get Messages Tests")
    class GetMessagesTests {

        @Test
        @DisplayName("Should get messages with pagination")
        void shouldGetMessagesWithPagination() {
            // Given
            UUID conversationId = privateConversation.getId();
            Page<Message> messagePage = new PageImpl<>(List.of(testMessage));

            when(conversationRepository.findById(conversationId))
                    .thenReturn(Optional.of(privateConversation));
            when(messageRepository.findByConversationId(eq(conversationId), any(PageRequest.class)))
                    .thenReturn(messagePage);

            // When
            Page<MessageResponse> results = messagingService.getMessages(conversationId, user1Id, 0, 20);

            // Then
            assertThat(results.getContent()).hasSize(1);
            assertThat(results.getContent().get(0).getContent()).isEqualTo("Test message");
        }

        @Test
        @DisplayName("Should throw exception when user not participant for get messages")
        void shouldThrowExceptionWhenNotParticipantForGetMessages() {
            // Given
            UUID conversationId = privateConversation.getId();
            when(conversationRepository.findById(conversationId))
                    .thenReturn(Optional.of(privateConversation));

            // When/Then
            assertThatThrownBy(() -> messagingService.getMessages(conversationId, user3Id, 0, 20))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User is not a participant of this conversation");
        }
    }

    @Nested
    @DisplayName("Edit Message Tests")
    class EditMessageTests {

        @Test
        @DisplayName("Should edit message successfully")
        void shouldEditMessageSuccessfully() {
            // Given
            UUID messageId = testMessage.getId();
            when(messageRepository.findById(messageId)).thenReturn(Optional.of(testMessage));
            when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            MessageResponse response = messagingService.editMessage(messageId, user1Id, "Updated content");

            // Then
            assertThat(response.getContent()).isEqualTo("Updated content");
            assertThat(response.getIsEdited()).isTrue();
        }

        @Test
        @DisplayName("Should throw exception when non-sender tries to edit")
        void shouldThrowExceptionWhenNonSenderTriesToEdit() {
            // Given
            UUID messageId = testMessage.getId();
            when(messageRepository.findById(messageId)).thenReturn(Optional.of(testMessage));

            // When/Then - user2 is not the sender
            assertThatThrownBy(() -> messagingService.editMessage(messageId, user2Id, "Updated"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Only the sender can edit the message");
        }

        @Test
        @DisplayName("Should throw exception when message not found")
        void shouldThrowExceptionWhenMessageNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(messageRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> messagingService.editMessage(unknownId, user1Id, "Updated"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Message not found");
        }
    }

    @Nested
    @DisplayName("Delete Message Tests")
    class DeleteMessageTests {

        @Test
        @DisplayName("Should delete message successfully (soft delete)")
        void shouldDeleteMessageSuccessfully() {
            // Given
            UUID messageId = testMessage.getId();
            when(messageRepository.findById(messageId)).thenReturn(Optional.of(testMessage));
            when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            messagingService.deleteMessage(messageId, user1Id);

            // Then
            verify(messageRepository).save(argThat(msg ->
                    msg.getIsDeleted() && msg.getContent().equals("[Message deleted]")
            ));
        }

        @Test
        @DisplayName("Should throw exception when non-sender tries to delete")
        void shouldThrowExceptionWhenNonSenderTriesToDelete() {
            // Given
            UUID messageId = testMessage.getId();
            when(messageRepository.findById(messageId)).thenReturn(Optional.of(testMessage));

            // When/Then
            assertThatThrownBy(() -> messagingService.deleteMessage(messageId, user2Id))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Only the sender can delete the message");
        }
    }

    @Nested
    @DisplayName("Mark Messages As Read Tests")
    class MarkMessagesAsReadTests {

        @Test
        @DisplayName("Should mark messages as read successfully")
        void shouldMarkMessagesAsReadSuccessfully() {
            // Given
            UUID conversationId = privateConversation.getId();
            Message unreadMessage = Message.builder()
                    .id(UUID.randomUUID())
                    .content("Unread message")
                    .sender(user2)
                    .conversation(privateConversation)
                    .readBy(new HashSet<>(Set.of(user2Id)))
                    .build();

            when(conversationRepository.findByIdWithParticipants(conversationId))
                    .thenReturn(Optional.of(privateConversation));
            when(messageRepository.findUnreadMessages(conversationId, user1Id))
                    .thenReturn(List.of(unreadMessage));
            when(messageRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            messagingService.markMessagesAsRead(conversationId, user1Id);

            // Then
            verify(messageRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("Should throw exception when non-participant tries to mark as read")
        void shouldThrowExceptionWhenNonParticipantTriesToMarkAsRead() {
            // Given
            UUID conversationId = privateConversation.getId();
            when(conversationRepository.findByIdWithParticipants(conversationId))
                    .thenReturn(Optional.of(privateConversation));

            // When/Then
            assertThatThrownBy(() -> messagingService.markMessagesAsRead(conversationId, user3Id))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User is not a participant of this conversation");
        }
    }
}

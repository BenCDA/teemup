package com.teemup.repository;

import com.teemup.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.isDeleted = false ORDER BY m.createdAt DESC")
    Page<Message> findByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND :userId NOT MEMBER OF m.readBy AND m.sender.id != :userId AND m.isDeleted = false")
    Long countUnreadMessages(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);

    /**
     * Batch insert read receipts for all unread messages in a conversation.
     * Uses native SQL to perform a single INSERT...SELECT instead of loading entities.
     */
    @Modifying
    @Query(value = "INSERT INTO message_read_by (message_id, user_id) " +
           "SELECT m.id, :userId FROM messages m " +
           "WHERE m.conversation_id = :conversationId " +
           "AND m.sender_id != :userId " +
           "AND m.is_deleted = false " +
           "AND NOT EXISTS (SELECT 1 FROM message_read_by mrb WHERE mrb.message_id = m.id AND mrb.user_id = :userId)",
           nativeQuery = true)
    void markAllAsReadBatch(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}

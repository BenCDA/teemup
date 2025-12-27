package com.teemup.repository;

import com.teemup.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.isDeleted = false ORDER BY m.createdAt DESC")
    Page<Message> findByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.isDeleted = false ORDER BY m.createdAt ASC")
    List<Message> findAllByConversationId(@Param("conversationId") UUID conversationId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND :userId NOT MEMBER OF m.readBy AND m.sender.id != :userId AND m.isDeleted = false")
    Long countUnreadMessages(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND :userId NOT MEMBER OF m.readBy AND m.sender.id != :userId AND m.isDeleted = false")
    List<Message> findUnreadMessages(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}

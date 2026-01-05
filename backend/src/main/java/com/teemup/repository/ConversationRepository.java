package com.teemup.repository;

import com.teemup.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT DISTINCT c FROM Conversation c JOIN FETCH c.participants WHERE c.id IN " +
           "(SELECT c2.id FROM Conversation c2 JOIN c2.participants p WHERE p.id = :userId) " +
           "ORDER BY c.lastMessageAt DESC NULLS LAST")
    List<Conversation> findByParticipantId(@Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c WHERE c.type = 'PRIVATE' AND " +
           "EXISTS (SELECT 1 FROM c.participants p1 WHERE p1.id = :user1Id) AND " +
           "EXISTS (SELECT 1 FROM c.participants p2 WHERE p2.id = :user2Id)")
    Optional<Conversation> findPrivateConversation(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    @Query("SELECT c FROM Conversation c JOIN FETCH c.participants WHERE c.id = :conversationId")
    Optional<Conversation> findByIdWithParticipants(@Param("conversationId") UUID conversationId);
}

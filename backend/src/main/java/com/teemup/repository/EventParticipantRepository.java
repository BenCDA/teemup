package com.teemup.repository;

import com.teemup.entity.EventParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventParticipantRepository extends JpaRepository<EventParticipant, UUID> {

    @Query("SELECT ep FROM EventParticipant ep WHERE ep.event.id = :eventId AND ep.status = 'CONFIRMED'")
    List<EventParticipant> findConfirmedByEventId(@Param("eventId") UUID eventId);

    @Query("SELECT ep FROM EventParticipant ep WHERE ep.event.id = :eventId")
    List<EventParticipant> findAllByEventId(@Param("eventId") UUID eventId);

    Optional<EventParticipant> findByEventIdAndUserId(UUID eventId, UUID userId);

    boolean existsByEventIdAndUserId(UUID eventId, UUID userId);

    @Query("SELECT COUNT(ep) FROM EventParticipant ep WHERE ep.event.id = :eventId AND ep.status = 'CONFIRMED'")
    Long countConfirmedByEventId(@Param("eventId") UUID eventId);

    @Query("SELECT ep FROM EventParticipant ep WHERE ep.user.id = :userId AND ep.status = 'CONFIRMED'")
    List<EventParticipant> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT ep FROM EventParticipant ep WHERE ep.event.id = :eventId AND ep.status = 'PENDING'")
    List<EventParticipant> findPendingByEventId(@Param("eventId") UUID eventId);

    void deleteByEventIdAndUserId(UUID eventId, UUID userId);
}

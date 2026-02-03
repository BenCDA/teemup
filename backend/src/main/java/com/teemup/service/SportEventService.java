package com.teemup.service;

import com.teemup.dto.event.CreateSportEventRequest;
import com.teemup.dto.event.SportEventResponse;
import com.teemup.entity.EventParticipant;
import com.teemup.entity.SportEvent;
import com.teemup.entity.User;
import com.teemup.exception.*;
import com.teemup.repository.EventParticipantRepository;
import com.teemup.repository.SportEventRepository;
import com.teemup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SportEventService {

    private final SportEventRepository sportEventRepository;
    private final EventParticipantRepository eventParticipantRepository;
    private final UserRepository userRepository;

    @Transactional
    public SportEventResponse createEvent(UUID userId, CreateSportEventRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Check if user is Pro before allowing paid events
        Boolean isPaid = request.getIsPaid() != null && request.getIsPaid();
        if (isPaid && !Boolean.TRUE.equals(user.getIsPro())) {
            throw new ProUserRequiredException();
        }

        SportEvent event = SportEvent.builder()
                .user(user)
                .sport(request.getSport())
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .recurrence(SportEvent.RecurrenceType.valueOf(request.getRecurrence()))
                .isPublic(request.getIsPublic())
                .maxParticipants(request.getMaxParticipants())
                .isPaid(isPaid)
                .price(isPaid ? request.getPrice() : null)
                .build();

        event = sportEventRepository.save(event);
        return SportEventResponse.fromEntity(event);
    }

    public List<SportEventResponse> getUserEvents(UUID userId) {
        return sportEventRepository.findByUserIdOrderByDateAscStartTimeAsc(userId).stream()
                .map(SportEventResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get user's upcoming events. If requesterId equals userId, returns all events.
     * Otherwise, returns only public events (respects privacy).
     */
    public List<SportEventResponse> getUserUpcomingEvents(UUID userId, UUID requesterId) {
        return sportEventRepository.findByUserIdAndDateGreaterThanEqualOrderByDateAscStartTimeAsc(userId, LocalDate.now()).stream()
                .filter(event -> event.getIsPublic() || event.getUser().getId().equals(requesterId))
                .map(SportEventResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get event by ID with full details including participants.
     */
    @Transactional(readOnly = true)
    public SportEventResponse getEventById(UUID eventId, UUID requesterId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        // Only allow access if event is public or requester is the owner
        if (!event.getIsPublic() && !event.getUser().getId().equals(requesterId)) {
            throw new PrivateEventException();
        }

        return SportEventResponse.fromEntityWithDetails(event, requesterId);
    }

    /**
     * Get public event by ID (no authentication required).
     */
    @Transactional(readOnly = true)
    public SportEventResponse getPublicEventById(UUID eventId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        if (!event.getIsPublic()) {
            throw new PrivateEventException();
        }

        return SportEventResponse.fromEntity(event);
    }

    @Transactional
    public SportEventResponse updateEvent(UUID eventId, UUID userId, CreateSportEventRequest request) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        if (!event.getUser().getId().equals(userId)) {
            throw new UnauthorizedEventAccessException("Vous n'êtes pas autorisé à modifier cet événement");
        }

        // Check if user is Pro before allowing paid events
        Boolean isPaid = request.getIsPaid() != null && request.getIsPaid();
        if (isPaid && !Boolean.TRUE.equals(event.getUser().getIsPro())) {
            throw new ProUserRequiredException();
        }

        event.setSport(request.getSport());
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setDate(request.getDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setRecurrence(SportEvent.RecurrenceType.valueOf(request.getRecurrence()));
        event.setIsPublic(request.getIsPublic());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setIsPaid(isPaid);
        event.setPrice(isPaid ? request.getPrice() : null);

        event = sportEventRepository.save(event);
        return SportEventResponse.fromEntity(event);
    }

    @Transactional
    public void deleteEvent(UUID eventId, UUID userId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        if (!event.getUser().getId().equals(userId)) {
            throw new UnauthorizedEventAccessException("Vous n'êtes pas autorisé à supprimer cet événement");
        }

        sportEventRepository.delete(event);
    }

    public List<SportEventResponse> getPublicEvents() {
        return sportEventRepository.findPublicEventsFromDate(LocalDate.now()).stream()
                .map(SportEventResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SportEventResponse> getPublicEventsBySport(String sport) {
        return sportEventRepository.findPublicEventsBySportFromDate(sport, LocalDate.now()).stream()
                .map(SportEventResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Search public events within a certain distance from user's location.
     */
    public List<SportEventResponse> searchEventsNearby(
            Double userLatitude,
            Double userLongitude,
            Double maxDistanceKm,
            String sport
    ) {
        if (userLatitude == null || userLongitude == null) {
            throw new InvalidLocationException();
        }

        List<SportEvent> events;
        if (sport != null && !sport.isBlank()) {
            events = sportEventRepository.findPublicEventsBySportFromDate(sport, LocalDate.now());
        } else {
            events = sportEventRepository.findPublicEventsFromDate(LocalDate.now());
        }

        return events.stream()
                .filter(event -> event.getLatitude() != null && event.getLongitude() != null)
                .map(event -> {
                    double distance = calculateHaversineDistance(
                            userLatitude, userLongitude,
                            event.getLatitude(), event.getLongitude()
                    );
                    return new EventWithDistance(event, distance);
                })
                .filter(ewd -> ewd.distance <= maxDistanceKm)
                .sorted((a, b) -> Double.compare(a.distance, b.distance))
                .map(ewd -> SportEventResponse.fromEntityWithDistance(ewd.event, Math.round(ewd.distance * 10.0) / 10.0))
                .collect(Collectors.toList());
    }

    // ===================== PARTICIPATION METHODS =====================

    /**
     * Join an event
     */
    @Transactional
    public SportEventResponse joinEvent(UUID eventId, UUID userId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Check if user is already participating
        if (eventParticipantRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new UserAlreadyParticipatingException();
        }

        // Check if user is the organizer
        if (event.getUser().getId().equals(userId)) {
            throw new CannotJoinOwnEventException();
        }

        // Check max participants (null-safe)
        if (event.getMaxParticipants() != null) {
            Long countObj = eventParticipantRepository.countConfirmedByEventId(eventId);
            long currentCount = countObj != null ? countObj : 0L;
            if (currentCount >= event.getMaxParticipants()) {
                throw new EventFullException();
            }
        }

        // For public events, auto-confirm. For private, set to pending.
        EventParticipant.ParticipantStatus status = event.getIsPublic()
                ? EventParticipant.ParticipantStatus.CONFIRMED
                : EventParticipant.ParticipantStatus.PENDING;

        EventParticipant participant = EventParticipant.builder()
                .event(event)
                .user(user)
                .status(status)
                .build();

        eventParticipantRepository.save(participant);

        // Refresh event to get updated participants
        event = sportEventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        return SportEventResponse.fromEntityWithDetails(event, userId);
    }

    /**
     * Leave an event
     */
    @Transactional
    public SportEventResponse leaveEvent(UUID eventId, UUID userId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        EventParticipant participant = eventParticipantRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(NotParticipatingException::new);

        eventParticipantRepository.delete(participant);

        // Refresh event to get updated participants
        event = sportEventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        return SportEventResponse.fromEntityWithDetails(event, userId);
    }

    /**
     * Get events where user is participating
     */
    public List<SportEventResponse> getParticipatingEvents(UUID userId) {
        return eventParticipantRepository.findByUserId(userId).stream()
                .map(p -> SportEventResponse.fromEntity(p.getEvent()))
                .collect(Collectors.toList());
    }

    // ===================== PARTICIPANT APPROVAL METHODS =====================

    /**
     * Approve a pending participant (for private events)
     */
    @Transactional
    public SportEventResponse approveParticipant(UUID eventId, UUID participantId, UUID organizerId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        // Only the organizer can approve participants
        if (!event.getUser().getId().equals(organizerId)) {
            throw new UnauthorizedEventAccessException("Seul l'organisateur peut approuver les participants");
        }

        EventParticipant participant = eventParticipantRepository.findById(participantId)
                .orElseThrow(() -> new ParticipantNotFoundException(participantId));

        // Verify participant belongs to this event
        if (!participant.getEvent().getId().equals(eventId)) {
            throw new ParticipantNotFoundException(participantId);
        }

        // Check if event is full before approving
        if (event.getMaxParticipants() != null) {
            Long countObj = eventParticipantRepository.countConfirmedByEventId(eventId);
            long currentCount = countObj != null ? countObj : 0L;
            if (currentCount >= event.getMaxParticipants()) {
                throw new EventFullException();
            }
        }

        participant.setStatus(EventParticipant.ParticipantStatus.CONFIRMED);
        eventParticipantRepository.save(participant);

        // Refresh event
        event = sportEventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        return SportEventResponse.fromEntityWithDetails(event, organizerId);
    }

    /**
     * Reject a pending participant (for private events)
     */
    @Transactional
    public SportEventResponse rejectParticipant(UUID eventId, UUID participantId, UUID organizerId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        // Only the organizer can reject participants
        if (!event.getUser().getId().equals(organizerId)) {
            throw new UnauthorizedEventAccessException("Seul l'organisateur peut rejeter les participants");
        }

        EventParticipant participant = eventParticipantRepository.findById(participantId)
                .orElseThrow(() -> new ParticipantNotFoundException(participantId));

        // Verify participant belongs to this event
        if (!participant.getEvent().getId().equals(eventId)) {
            throw new ParticipantNotFoundException(participantId);
        }

        participant.setStatus(EventParticipant.ParticipantStatus.DECLINED);
        eventParticipantRepository.save(participant);

        // Refresh event
        event = sportEventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        return SportEventResponse.fromEntityWithDetails(event, organizerId);
    }

    /**
     * Get pending participants for an event (only for organizer)
     */
    @Transactional(readOnly = true)
    public List<EventParticipant> getPendingParticipants(UUID eventId, UUID organizerId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        // Only the organizer can see pending participants
        if (!event.getUser().getId().equals(organizerId)) {
            throw new UnauthorizedEventAccessException("Seul l'organisateur peut voir les demandes en attente");
        }

        return eventParticipantRepository.findPendingByEventId(eventId);
    }

    // ===================== HELPER METHODS =====================

    private double calculateHaversineDistance(
            double lat1, double lon1,
            double lat2, double lon2
    ) {
        final double R = 6371; // Earth's radius in kilometers

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private record EventWithDistance(SportEvent event, double distance) {}
}

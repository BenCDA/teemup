package com.teemup.service;

import com.teemup.dto.event.CreateSportEventRequest;
import com.teemup.dto.event.SportEventResponse;
import com.teemup.entity.SportEvent;
import com.teemup.entity.User;
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
    private final UserRepository userRepository;

    @Transactional
    public SportEventResponse createEvent(UUID userId, CreateSportEventRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

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
     * Get event by ID. Checks if event is public or if requester is the owner.
     */
    public SportEventResponse getEventById(UUID eventId, UUID requesterId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Only allow access if event is public or requester is the owner
        if (!event.getIsPublic() && !event.getUser().getId().equals(requesterId)) {
            throw new RuntimeException("This event is private");
        }

        return SportEventResponse.fromEntity(event);
    }

    @Transactional
    public SportEventResponse updateEvent(UUID eventId, UUID userId, CreateSportEventRequest request) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to update this event");
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

        event = sportEventRepository.save(event);
        return SportEventResponse.fromEntity(event);
    }

    @Transactional
    public void deleteEvent(UUID eventId, UUID userId) {
        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this event");
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
     * Uses Haversine formula to calculate distance between coordinates.
     *
     * @param userLatitude  User's latitude
     * @param userLongitude User's longitude
     * @param maxDistanceKm Maximum distance in kilometers
     * @param sport         Optional sport filter (null for all sports)
     * @return List of events within the specified distance, sorted by distance
     */
    public List<SportEventResponse> searchEventsNearby(
            Double userLatitude,
            Double userLongitude,
            Double maxDistanceKm,
            String sport
    ) {
        if (userLatitude == null || userLongitude == null) {
            throw new RuntimeException("User location is required for nearby search");
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

    /**
     * Calculate distance between two coordinates using Haversine formula.
     * Returns distance in kilometers.
     */
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

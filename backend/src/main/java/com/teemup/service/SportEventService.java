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
}

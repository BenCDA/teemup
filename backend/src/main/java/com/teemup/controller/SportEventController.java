package com.teemup.controller;

import com.teemup.dto.event.CreateSportEventRequest;
import com.teemup.dto.event.SportEventResponse;
import com.teemup.dto.event.ParticipantResponse;
import com.teemup.entity.EventParticipant;
import com.teemup.security.UserDetailsImpl;
import com.teemup.service.SportEventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Validated
public class SportEventController {

    private final SportEventService sportEventService;

    @PostMapping
    public ResponseEntity<SportEventResponse> createEvent(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateSportEventRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sportEventService.createEvent(userDetails.getId(), request));
    }

    @GetMapping("/me")
    public ResponseEntity<List<SportEventResponse>> getMyEvents(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(sportEventService.getUserEvents(userDetails.getId()));
    }

    @GetMapping("/me/upcoming")
    public ResponseEntity<List<SportEventResponse>> getMyUpcomingEvents(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(sportEventService.getUserUpcomingEvents(userDetails.getId(), userDetails.getId()));
    }

    @GetMapping("/me/participating")
    public ResponseEntity<List<SportEventResponse>> getParticipatingEvents(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(sportEventService.getParticipatingEvents(userDetails.getId()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SportEventResponse>> getUserEvents(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        // Pass requester ID to filter private events
        return ResponseEntity.ok(sportEventService.getUserUpcomingEvents(userId, userDetails.getId()));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<SportEventResponse> getEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        // Pass requester ID to check access rights and participation status
        return ResponseEntity.ok(sportEventService.getEventById(eventId, userDetails.getId()));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<SportEventResponse> updateEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateSportEventRequest request
    ) {
        return ResponseEntity.ok(sportEventService.updateEvent(eventId, userDetails.getId(), request));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        sportEventService.deleteEvent(eventId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    // ===================== PARTICIPATION ENDPOINTS =====================

    @PostMapping("/{eventId}/join")
    public ResponseEntity<SportEventResponse> joinEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(sportEventService.joinEvent(eventId, userDetails.getId()));
    }

    @DeleteMapping("/{eventId}/leave")
    public ResponseEntity<SportEventResponse> leaveEvent(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(sportEventService.leaveEvent(eventId, userDetails.getId()));
    }

    // ===================== PARTICIPANT APPROVAL ENDPOINTS =====================

    /**
     * Get pending participants for an event (only for organizer)
     */
    @GetMapping("/{eventId}/participants/pending")
    public ResponseEntity<List<ParticipantResponse>> getPendingParticipants(
            @PathVariable UUID eventId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        List<EventParticipant> participants = sportEventService.getPendingParticipants(eventId, userDetails.getId());
        List<ParticipantResponse> responses = participants.stream()
                .map(ParticipantResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Approve a pending participant
     */
    @PutMapping("/{eventId}/participants/{participantId}/approve")
    public ResponseEntity<SportEventResponse> approveParticipant(
            @PathVariable UUID eventId,
            @PathVariable UUID participantId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(sportEventService.approveParticipant(eventId, participantId, userDetails.getId()));
    }

    /**
     * Reject a pending participant
     */
    @PutMapping("/{eventId}/participants/{participantId}/reject")
    public ResponseEntity<SportEventResponse> rejectParticipant(
            @PathVariable UUID eventId,
            @PathVariable UUID participantId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(sportEventService.rejectParticipant(eventId, participantId, userDetails.getId()));
    }

    // ===================== PUBLIC ENDPOINTS =====================

    @GetMapping("/public")
    public ResponseEntity<List<SportEventResponse>> getPublicEvents() {
        return ResponseEntity.ok(sportEventService.getPublicEvents());
    }

    @GetMapping("/public/sport/{sport}")
    public ResponseEntity<List<SportEventResponse>> getPublicEventsBySport(@PathVariable String sport) {
        return ResponseEntity.ok(sportEventService.getPublicEventsBySport(sport));
    }

    /**
     * Get a public event by ID (no authentication required)
     */
    @GetMapping("/public/{eventId}")
    public ResponseEntity<SportEventResponse> getPublicEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(sportEventService.getPublicEventById(eventId));
    }

    /**
     * Search for public events near a location.
     *
     * @param latitude      User's latitude (required)
     * @param longitude     User's longitude (required)
     * @param maxDistance   Maximum distance in kilometers (default 50km, min 1km, max 500km)
     * @param sport         Optional sport filter
     * @return List of events within the specified distance, sorted by proximity
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<SportEventResponse>> searchNearbyEvents(
            @RequestParam @NotNull(message = "La latitude est requise") Double latitude,
            @RequestParam @NotNull(message = "La longitude est requise") Double longitude,
            @RequestParam(defaultValue = "50") @Min(value = 1, message = "Distance minimum: 1km") @Max(value = 500, message = "Distance maximum: 500km") Double maxDistance,
            @RequestParam(required = false) String sport
    ) {
        return ResponseEntity.ok(sportEventService.searchEventsNearby(latitude, longitude, maxDistance, sport));
    }
}

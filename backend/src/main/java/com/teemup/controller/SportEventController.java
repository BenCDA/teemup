package com.teemup.controller;

import com.teemup.dto.event.CreateSportEventRequest;
import com.teemup.dto.event.SportEventResponse;
import com.teemup.security.UserDetailsImpl;
import com.teemup.service.SportEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
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
        // Pass requester ID to check access rights
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

    @GetMapping("/public")
    public ResponseEntity<List<SportEventResponse>> getPublicEvents() {
        return ResponseEntity.ok(sportEventService.getPublicEvents());
    }

    @GetMapping("/public/sport/{sport}")
    public ResponseEntity<List<SportEventResponse>> getPublicEventsBySport(@PathVariable String sport) {
        return ResponseEntity.ok(sportEventService.getPublicEventsBySport(sport));
    }

    /**
     * Search for public events near a location.
     *
     * @param latitude      User's latitude
     * @param longitude     User's longitude
     * @param maxDistance   Maximum distance in kilometers (default 50km)
     * @param sport         Optional sport filter
     * @return List of events within the specified distance, sorted by proximity
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<SportEventResponse>> searchNearbyEvents(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "50") Double maxDistance,
            @RequestParam(required = false) String sport
    ) {
        return ResponseEntity.ok(sportEventService.searchEventsNearby(latitude, longitude, maxDistance, sport));
    }
}

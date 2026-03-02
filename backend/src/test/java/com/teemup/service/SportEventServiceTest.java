package com.teemup.service;

import com.teemup.dto.event.CreateSportEventRequest;
import com.teemup.dto.event.SportEventResponse;
import com.teemup.entity.EventParticipant;
import com.teemup.entity.Notification;
import com.teemup.entity.SportEvent;
import com.teemup.entity.User;
import com.teemup.exception.*;
import com.teemup.repository.EventParticipantRepository;
import com.teemup.repository.SportEventRepository;
import com.teemup.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SportEventService Tests")
class SportEventServiceTest {

    @Mock
    private SportEventRepository sportEventRepository;

    @Mock
    private EventParticipantRepository eventParticipantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private SportEventService sportEventService;

    private User organizer;
    private User participant;
    private UUID organizerId;
    private UUID participantId;
    private UUID eventId;
    private SportEvent publicEvent;
    private SportEvent privateEvent;
    private CreateSportEventRequest createRequest;

    @BeforeEach
    void setUp() {
        organizerId = UUID.randomUUID();
        participantId = UUID.randomUUID();
        eventId = UUID.randomUUID();

        organizer = User.builder()
                .id(organizerId)
                .email("organizer@example.com")
                .password("password")
                .firstName("Pierre")
                .lastName("Dupont")
                .isPro(false)
                .isOnline(true)
                .isVerified(true)
                .sports(new HashSet<>())
                .friends(new HashSet<>())
                .build();

        participant = User.builder()
                .id(participantId)
                .email("participant@example.com")
                .password("password")
                .firstName("Marie")
                .lastName("Martin")
                .isPro(false)
                .isOnline(true)
                .isVerified(true)
                .sports(new HashSet<>())
                .friends(new HashSet<>())
                .build();

        publicEvent = SportEvent.builder()
                .id(eventId)
                .user(organizer)
                .sport("Football")
                .title("Match amical")
                .description("Un match amical entre amis")
                .location("Stade de France")
                .latitude(48.9244)
                .longitude(2.3601)
                .date(LocalDate.now().plusDays(7))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(16, 0))
                .recurrence(SportEvent.RecurrenceType.NONE)
                .isPublic(true)
                .maxParticipants(10)
                .isPaid(false)
                .participants(new ArrayList<>())
                .build();

        privateEvent = SportEvent.builder()
                .id(UUID.randomUUID())
                .user(organizer)
                .sport("Tennis")
                .title("Tennis privé")
                .description("Session privée")
                .location("Court privé")
                .latitude(48.8566)
                .longitude(2.3522)
                .date(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .recurrence(SportEvent.RecurrenceType.NONE)
                .isPublic(false)
                .maxParticipants(4)
                .isPaid(false)
                .participants(new ArrayList<>())
                .build();

        createRequest = new CreateSportEventRequest();
        createRequest.setSport("Football");
        createRequest.setTitle("Match amical");
        createRequest.setDescription("Un match amical entre amis");
        createRequest.setLocation("Stade de France");
        createRequest.setLatitude(48.9244);
        createRequest.setLongitude(2.3601);
        createRequest.setDate(LocalDate.now().plusDays(7));
        createRequest.setStartTime(LocalTime.of(14, 0));
        createRequest.setEndTime(LocalTime.of(16, 0));
        createRequest.setRecurrence("NONE");
        createRequest.setIsPublic(true);
        createRequest.setMaxParticipants(10);
        createRequest.setIsPaid(false);
    }

    // =====================================================================
    // CREATE EVENT TESTS
    // =====================================================================

    @Nested
    @DisplayName("Création d'événement")
    class CreateEventTests {

        @Test
        @DisplayName("Devrait créer un événement avec succès")
        void shouldCreateEventSuccessfully() {
            // Given
            when(userRepository.findById(organizerId)).thenReturn(Optional.of(organizer));
            when(sportEventRepository.save(any(SportEvent.class))).thenAnswer(invocation -> {
                SportEvent saved = invocation.getArgument(0);
                saved.setId(eventId);
                return saved;
            });

            // When
            SportEventResponse response = sportEventService.createEvent(organizerId, createRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getSport()).isEqualTo("Football");
            assertThat(response.getTitle()).isEqualTo("Match amical");
            assertThat(response.getIsPublic()).isTrue();
            assertThat(response.getIsPaid()).isFalse();

            verify(userRepository).findById(organizerId);
            verify(sportEventRepository).save(any(SportEvent.class));
        }

        @Test
        @DisplayName("Devrait créer un événement avec localisation")
        void shouldCreateEventWithLocation() {
            // Given
            createRequest.setLatitude(48.8566);
            createRequest.setLongitude(2.3522);
            createRequest.setLocation("Paris, France");

            when(userRepository.findById(organizerId)).thenReturn(Optional.of(organizer));
            when(sportEventRepository.save(any(SportEvent.class))).thenAnswer(invocation -> {
                SportEvent saved = invocation.getArgument(0);
                saved.setId(eventId);
                return saved;
            });

            // When
            SportEventResponse response = sportEventService.createEvent(organizerId, createRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getLatitude()).isEqualTo(48.8566);
            assertThat(response.getLongitude()).isEqualTo(2.3522);
            assertThat(response.getLocation()).isEqualTo("Paris, France");

            verify(sportEventRepository).save(argThat(event ->
                    event.getLatitude().equals(48.8566) && event.getLongitude().equals(2.3522)
            ));
        }

        @Test
        @DisplayName("Devrait créer un événement payant par un utilisateur Pro")
        void shouldCreatePaidEventByProUser() {
            // Given
            organizer.setIsPro(true);
            createRequest.setIsPaid(true);
            createRequest.setPrice(15.0);

            when(userRepository.findById(organizerId)).thenReturn(Optional.of(organizer));
            when(sportEventRepository.save(any(SportEvent.class))).thenAnswer(invocation -> {
                SportEvent saved = invocation.getArgument(0);
                saved.setId(eventId);
                return saved;
            });

            // When
            SportEventResponse response = sportEventService.createEvent(organizerId, createRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getIsPaid()).isTrue();
            assertThat(response.getPrice()).isEqualTo(15.0);

            verify(sportEventRepository).save(argThat(event ->
                    event.getIsPaid() && event.getPrice().equals(15.0)
            ));
        }

        @Test
        @DisplayName("Devrait échouer pour un événement payant par un utilisateur non-Pro")
        void shouldFailWhenNonProUserCreatesPaidEvent() {
            // Given
            organizer.setIsPro(false);
            createRequest.setIsPaid(true);
            createRequest.setPrice(10.0);

            when(userRepository.findById(organizerId)).thenReturn(Optional.of(organizer));

            // When/Then
            assertThatThrownBy(() -> sportEventService.createEvent(organizerId, createRequest))
                    .isInstanceOf(ProUserRequiredException.class)
                    .hasMessage("Seuls les utilisateurs Pro peuvent créer des événements payants");

            verify(sportEventRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait échouer si l'utilisateur n'existe pas")
        void shouldFailWhenUserNotFound() {
            // Given
            when(userRepository.findById(organizerId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.createEvent(organizerId, createRequest))
                    .isInstanceOf(UserNotFoundException.class);

            verify(sportEventRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait ignorer le prix si l'événement n'est pas payant")
        void shouldIgnorePriceWhenEventIsNotPaid() {
            // Given
            createRequest.setIsPaid(false);
            createRequest.setPrice(25.0);

            when(userRepository.findById(organizerId)).thenReturn(Optional.of(organizer));
            when(sportEventRepository.save(any(SportEvent.class))).thenAnswer(invocation -> {
                SportEvent saved = invocation.getArgument(0);
                saved.setId(eventId);
                return saved;
            });

            // When
            SportEventResponse response = sportEventService.createEvent(organizerId, createRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getIsPaid()).isFalse();

            verify(sportEventRepository).save(argThat(event ->
                    !event.getIsPaid() && event.getPrice() == null
            ));
        }

        @Test
        @DisplayName("Devrait créer un événement avec récurrence hebdomadaire")
        void shouldCreateEventWithWeeklyRecurrence() {
            // Given
            createRequest.setRecurrence("WEEKLY");

            when(userRepository.findById(organizerId)).thenReturn(Optional.of(organizer));
            when(sportEventRepository.save(any(SportEvent.class))).thenAnswer(invocation -> {
                SportEvent saved = invocation.getArgument(0);
                saved.setId(eventId);
                return saved;
            });

            // When
            SportEventResponse response = sportEventService.createEvent(organizerId, createRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getRecurrence()).isEqualTo("WEEKLY");

            verify(sportEventRepository).save(argThat(event ->
                    event.getRecurrence() == SportEvent.RecurrenceType.WEEKLY
            ));
        }
    }

    // =====================================================================
    // JOIN EVENT TESTS
    // =====================================================================

    @Nested
    @DisplayName("Rejoindre un événement")
    class JoinEventTests {

        @Test
        @DisplayName("Devrait rejoindre un événement public avec succès")
        void shouldJoinPublicEventSuccessfully() {
            // Given
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(userRepository.findById(participantId)).thenReturn(Optional.of(participant));
            when(eventParticipantRepository.existsByEventIdAndUserId(eventId, participantId)).thenReturn(false);
            when(eventParticipantRepository.countConfirmedByEventId(eventId)).thenReturn(3L);
            when(eventParticipantRepository.save(any(EventParticipant.class))).thenAnswer(invocation -> {
                EventParticipant saved = invocation.getArgument(0);
                saved.setId(UUID.randomUUID());
                return saved;
            });

            // After join, refresh returns event with updated participant
            SportEvent refreshedEvent = SportEvent.builder()
                    .id(eventId)
                    .user(organizer)
                    .sport("Football")
                    .title("Match amical")
                    .date(LocalDate.now().plusDays(7))
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(16, 0))
                    .recurrence(SportEvent.RecurrenceType.NONE)
                    .isPublic(true)
                    .maxParticipants(10)
                    .isPaid(false)
                    .participants(new ArrayList<>())
                    .build();

            // Second findById call returns refreshed event
            when(sportEventRepository.findById(eventId))
                    .thenReturn(Optional.of(publicEvent))
                    .thenReturn(Optional.of(refreshedEvent));

            // When
            SportEventResponse response = sportEventService.joinEvent(eventId, participantId);

            // Then
            assertThat(response).isNotNull();

            verify(eventParticipantRepository).save(argThat(ep ->
                    ep.getStatus() == EventParticipant.ParticipantStatus.CONFIRMED
                            && ep.getUser().getId().equals(participantId)
                            && ep.getEvent().getId().equals(eventId)
            ));

            verify(notificationService).createNotification(
                    eq(organizer),
                    eq(participant),
                    eq(Notification.NotificationType.EVENT_PARTICIPANT_JOINED),
                    anyString(),
                    anyString(),
                    eq(eventId.toString())
            );
        }

        @Test
        @DisplayName("Devrait rejoindre un événement privé avec statut PENDING")
        void shouldJoinPrivateEventWithPendingStatus() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(userRepository.findById(participantId)).thenReturn(Optional.of(participant));
            when(eventParticipantRepository.existsByEventIdAndUserId(privateEventId, participantId)).thenReturn(false);
            when(eventParticipantRepository.countConfirmedByEventId(privateEventId)).thenReturn(1L);
            when(eventParticipantRepository.save(any(EventParticipant.class))).thenAnswer(invocation -> {
                EventParticipant saved = invocation.getArgument(0);
                saved.setId(UUID.randomUUID());
                return saved;
            });

            // When
            SportEventResponse response = sportEventService.joinEvent(privateEventId, participantId);

            // Then
            assertThat(response).isNotNull();

            verify(eventParticipantRepository).save(argThat(ep ->
                    ep.getStatus() == EventParticipant.ParticipantStatus.PENDING
            ));
        }

        @Test
        @DisplayName("Devrait échouer si l'événement est complet")
        void shouldFailWhenEventIsFull() {
            // Given
            publicEvent.setMaxParticipants(5);
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(userRepository.findById(participantId)).thenReturn(Optional.of(participant));
            when(eventParticipantRepository.existsByEventIdAndUserId(eventId, participantId)).thenReturn(false);
            when(eventParticipantRepository.countConfirmedByEventId(eventId)).thenReturn(5L);

            // When/Then
            assertThatThrownBy(() -> sportEventService.joinEvent(eventId, participantId))
                    .isInstanceOf(EventFullException.class)
                    .hasMessage("Cet événement est complet");

            verify(eventParticipantRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait échouer si l'utilisateur participe déjà")
        void shouldFailWhenUserAlreadyParticipating() {
            // Given
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(userRepository.findById(participantId)).thenReturn(Optional.of(participant));
            when(eventParticipantRepository.existsByEventIdAndUserId(eventId, participantId)).thenReturn(true);

            // When/Then
            assertThatThrownBy(() -> sportEventService.joinEvent(eventId, participantId))
                    .isInstanceOf(UserAlreadyParticipatingException.class)
                    .hasMessage("Vous participez déjà à cet événement");

            verify(eventParticipantRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait échouer si l'organisateur essaie de rejoindre son propre événement")
        void shouldFailWhenOrganizerJoinsOwnEvent() {
            // Given
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(userRepository.findById(organizerId)).thenReturn(Optional.of(organizer));
            when(eventParticipantRepository.existsByEventIdAndUserId(eventId, organizerId)).thenReturn(false);

            // When/Then
            assertThatThrownBy(() -> sportEventService.joinEvent(eventId, organizerId))
                    .isInstanceOf(CannotJoinOwnEventException.class)
                    .hasMessage("Vous ne pouvez pas rejoindre votre propre événement");

            verify(eventParticipantRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait échouer si l'événement n'existe pas")
        void shouldFailWhenEventNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(sportEventRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.joinEvent(unknownId, participantId))
                    .isInstanceOf(EventNotFoundException.class);

            verify(eventParticipantRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait échouer si l'utilisateur n'existe pas")
        void shouldFailWhenUserNotFound() {
            // Given
            UUID unknownUserId = UUID.randomUUID();
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(userRepository.findById(unknownUserId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.joinEvent(eventId, unknownUserId))
                    .isInstanceOf(UserNotFoundException.class);

            verify(eventParticipantRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait permettre de rejoindre un événement sans limite de participants")
        void shouldAllowJoinWhenNoMaxParticipants() {
            // Given
            publicEvent.setMaxParticipants(null);
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(userRepository.findById(participantId)).thenReturn(Optional.of(participant));
            when(eventParticipantRepository.existsByEventIdAndUserId(eventId, participantId)).thenReturn(false);
            when(eventParticipantRepository.save(any(EventParticipant.class))).thenAnswer(invocation -> {
                EventParticipant saved = invocation.getArgument(0);
                saved.setId(UUID.randomUUID());
                return saved;
            });

            // When
            SportEventResponse response = sportEventService.joinEvent(eventId, participantId);

            // Then
            assertThat(response).isNotNull();

            // Should not check count when maxParticipants is null
            verify(eventParticipantRepository, never()).countConfirmedByEventId(any());
            verify(eventParticipantRepository).save(any(EventParticipant.class));
        }
    }

    // =====================================================================
    // LEAVE EVENT TESTS
    // =====================================================================

    @Nested
    @DisplayName("Quitter un événement")
    class LeaveEventTests {

        @Test
        @DisplayName("Devrait quitter un événement avec succès")
        void shouldLeaveEventSuccessfully() {
            // Given
            EventParticipant existingParticipant = EventParticipant.builder()
                    .id(UUID.randomUUID())
                    .event(publicEvent)
                    .user(participant)
                    .status(EventParticipant.ParticipantStatus.CONFIRMED)
                    .build();

            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(eventParticipantRepository.findByEventIdAndUserId(eventId, participantId))
                    .thenReturn(Optional.of(existingParticipant));

            // When
            SportEventResponse response = sportEventService.leaveEvent(eventId, participantId);

            // Then
            assertThat(response).isNotNull();

            verify(eventParticipantRepository).delete(existingParticipant);
            verify(sportEventRepository, times(2)).findById(eventId);
        }

        @Test
        @DisplayName("Devrait échouer si l'utilisateur ne participe pas à l'événement")
        void shouldFailWhenNotParticipating() {
            // Given
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(eventParticipantRepository.findByEventIdAndUserId(eventId, participantId))
                    .thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.leaveEvent(eventId, participantId))
                    .isInstanceOf(NotParticipatingException.class)
                    .hasMessage("Vous ne participez pas à cet événement");

            verify(eventParticipantRepository, never()).delete(any(EventParticipant.class));
        }

        @Test
        @DisplayName("Devrait échouer si l'événement n'existe pas")
        void shouldFailWhenEventNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(sportEventRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.leaveEvent(unknownId, participantId))
                    .isInstanceOf(EventNotFoundException.class);

            verify(eventParticipantRepository, never()).delete(any(EventParticipant.class));
        }
    }

    // =====================================================================
    // GET EVENT BY ID TESTS
    // =====================================================================

    @Nested
    @DisplayName("Récupérer un événement par ID")
    class GetEventByIdTests {

        @Test
        @DisplayName("Devrait récupérer un événement public avec succès")
        void shouldGetPublicEventSuccessfully() {
            // Given
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));

            // When
            SportEventResponse response = sportEventService.getEventById(eventId, participantId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(eventId);
            assertThat(response.getSport()).isEqualTo("Football");
            assertThat(response.getTitle()).isEqualTo("Match amical");

            verify(sportEventRepository).findById(eventId);
        }

        @Test
        @DisplayName("Devrait récupérer un événement privé par le propriétaire")
        void shouldGetPrivateEventByOwner() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));

            // When
            SportEventResponse response = sportEventService.getEventById(privateEventId, organizerId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(privateEventId);

            verify(sportEventRepository).findById(privateEventId);
        }

        @Test
        @DisplayName("Devrait échouer pour un événement privé accédé par un non-propriétaire")
        void shouldFailWhenNonOwnerAccessesPrivateEvent() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));

            // When/Then
            assertThatThrownBy(() -> sportEventService.getEventById(privateEventId, participantId))
                    .isInstanceOf(PrivateEventException.class)
                    .hasMessage("Cet événement est privé");
        }

        @Test
        @DisplayName("Devrait échouer si l'événement n'existe pas")
        void shouldFailWhenEventNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(sportEventRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.getEventById(unknownId, participantId))
                    .isInstanceOf(EventNotFoundException.class);
        }
    }

    // =====================================================================
    // GET PUBLIC EVENT BY ID TESTS
    // =====================================================================

    @Nested
    @DisplayName("Récupérer un événement public par ID")
    class GetPublicEventByIdTests {

        @Test
        @DisplayName("Devrait récupérer un événement public avec succès")
        void shouldGetPublicEventSuccessfully() {
            // Given
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));

            // When
            SportEventResponse response = sportEventService.getPublicEventById(eventId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(eventId);
            assertThat(response.getSport()).isEqualTo("Football");
        }

        @Test
        @DisplayName("Devrait échouer si l'événement est privé")
        void shouldFailWhenEventIsPrivate() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));

            // When/Then
            assertThatThrownBy(() -> sportEventService.getPublicEventById(privateEventId))
                    .isInstanceOf(PrivateEventException.class)
                    .hasMessage("Cet événement est privé");
        }

        @Test
        @DisplayName("Devrait échouer si l'événement n'existe pas")
        void shouldFailWhenEventNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(sportEventRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.getPublicEventById(unknownId))
                    .isInstanceOf(EventNotFoundException.class);
        }
    }

    // =====================================================================
    // UPDATE EVENT TESTS
    // =====================================================================

    @Nested
    @DisplayName("Mise à jour d'un événement")
    class UpdateEventTests {

        @Test
        @DisplayName("Devrait mettre à jour un événement avec succès par l'organisateur")
        void shouldUpdateEventSuccessfully() {
            // Given
            CreateSportEventRequest updateRequest = new CreateSportEventRequest();
            updateRequest.setSport("Basketball");
            updateRequest.setTitle("Match modifié");
            updateRequest.setDescription("Description modifiée");
            updateRequest.setLocation("Nouveau stade");
            updateRequest.setLatitude(48.85);
            updateRequest.setLongitude(2.35);
            updateRequest.setDate(LocalDate.now().plusDays(14));
            updateRequest.setStartTime(LocalTime.of(15, 0));
            updateRequest.setEndTime(LocalTime.of(17, 0));
            updateRequest.setRecurrence("WEEKLY");
            updateRequest.setIsPublic(true);
            updateRequest.setMaxParticipants(20);
            updateRequest.setIsPaid(false);

            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(sportEventRepository.save(any(SportEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            SportEventResponse response = sportEventService.updateEvent(eventId, organizerId, updateRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getSport()).isEqualTo("Basketball");
            assertThat(response.getTitle()).isEqualTo("Match modifié");

            verify(sportEventRepository).save(argThat(event ->
                    event.getSport().equals("Basketball")
                            && event.getTitle().equals("Match modifié")
                            && event.getRecurrence() == SportEvent.RecurrenceType.WEEKLY
            ));
        }

        @Test
        @DisplayName("Devrait échouer si un non-organisateur essaie de modifier l'événement")
        void shouldFailWhenNonOrganizerUpdates() {
            // Given
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));

            // When/Then
            assertThatThrownBy(() -> sportEventService.updateEvent(eventId, participantId, createRequest))
                    .isInstanceOf(UnauthorizedEventAccessException.class)
                    .hasMessage("Vous n'êtes pas autorisé à modifier cet événement");

            verify(sportEventRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait échouer si l'événement n'existe pas")
        void shouldFailWhenEventNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(sportEventRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.updateEvent(unknownId, organizerId, createRequest))
                    .isInstanceOf(EventNotFoundException.class);
        }

        @Test
        @DisplayName("Devrait échouer pour mise à jour payante par un non-Pro")
        void shouldFailWhenNonProUpdatesWithPaid() {
            // Given
            organizer.setIsPro(false);
            CreateSportEventRequest paidUpdate = new CreateSportEventRequest();
            paidUpdate.setIsPaid(true);
            paidUpdate.setPrice(20.0);
            paidUpdate.setSport("Football");
            paidUpdate.setRecurrence("NONE");

            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));

            // When/Then
            assertThatThrownBy(() -> sportEventService.updateEvent(eventId, organizerId, paidUpdate))
                    .isInstanceOf(ProUserRequiredException.class);

            verify(sportEventRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait permettre la mise à jour payante par un utilisateur Pro")
        void shouldAllowPaidUpdateByProUser() {
            // Given
            organizer.setIsPro(true);
            CreateSportEventRequest paidUpdate = new CreateSportEventRequest();
            paidUpdate.setIsPaid(true);
            paidUpdate.setPrice(30.0);
            paidUpdate.setSport("Football");
            paidUpdate.setTitle("Match payant");
            paidUpdate.setDescription("Desc");
            paidUpdate.setLocation("Stade");
            paidUpdate.setLatitude(48.85);
            paidUpdate.setLongitude(2.35);
            paidUpdate.setDate(LocalDate.now().plusDays(7));
            paidUpdate.setStartTime(LocalTime.of(14, 0));
            paidUpdate.setEndTime(LocalTime.of(16, 0));
            paidUpdate.setRecurrence("NONE");
            paidUpdate.setIsPublic(true);
            paidUpdate.setMaxParticipants(10);

            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));
            when(sportEventRepository.save(any(SportEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            SportEventResponse response = sportEventService.updateEvent(eventId, organizerId, paidUpdate);

            // Then
            assertThat(response).isNotNull();

            verify(sportEventRepository).save(argThat(event ->
                    event.getIsPaid() && event.getPrice().equals(30.0)
            ));
        }
    }

    // =====================================================================
    // DELETE EVENT TESTS
    // =====================================================================

    @Nested
    @DisplayName("Suppression d'un événement")
    class DeleteEventTests {

        @Test
        @DisplayName("Devrait supprimer un événement avec succès par l'organisateur")
        void shouldDeleteEventByOrganizer() {
            // Given
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));

            // When
            sportEventService.deleteEvent(eventId, organizerId);

            // Then
            verify(sportEventRepository).delete(publicEvent);
        }

        @Test
        @DisplayName("Devrait échouer si un non-organisateur essaie de supprimer")
        void shouldFailWhenNonOrganizerDeletes() {
            // Given
            when(sportEventRepository.findById(eventId)).thenReturn(Optional.of(publicEvent));

            // When/Then
            assertThatThrownBy(() -> sportEventService.deleteEvent(eventId, participantId))
                    .isInstanceOf(UnauthorizedEventAccessException.class)
                    .hasMessage("Vous n'êtes pas autorisé à supprimer cet événement");

            verify(sportEventRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Devrait échouer si l'événement n'existe pas")
        void shouldFailWhenEventNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(sportEventRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.deleteEvent(unknownId, organizerId))
                    .isInstanceOf(EventNotFoundException.class);

            verify(sportEventRepository, never()).delete(any());
        }
    }

    // =====================================================================
    // GET USER EVENTS TESTS
    // =====================================================================

    @Nested
    @DisplayName("Récupérer les événements d'un utilisateur")
    class GetUserEventsTests {

        @Test
        @DisplayName("Devrait récupérer les événements d'un utilisateur")
        void shouldGetUserEvents() {
            // Given
            when(sportEventRepository.findByUserIdOrderByDateAscStartTimeAsc(organizerId))
                    .thenReturn(List.of(publicEvent, privateEvent));

            // When
            List<SportEventResponse> results = sportEventService.getUserEvents(organizerId);

            // Then
            assertThat(results).hasSize(2);
            assertThat(results.get(0).getSport()).isEqualTo("Football");
            assertThat(results.get(1).getSport()).isEqualTo("Tennis");

            verify(sportEventRepository).findByUserIdOrderByDateAscStartTimeAsc(organizerId);
        }

        @Test
        @DisplayName("Devrait retourner une liste vide si aucun événement")
        void shouldReturnEmptyListWhenNoEvents() {
            // Given
            when(sportEventRepository.findByUserIdOrderByDateAscStartTimeAsc(organizerId))
                    .thenReturn(Collections.emptyList());

            // When
            List<SportEventResponse> results = sportEventService.getUserEvents(organizerId);

            // Then
            assertThat(results).isEmpty();
        }
    }

    // =====================================================================
    // GET USER UPCOMING EVENTS TESTS
    // =====================================================================

    @Nested
    @DisplayName("Récupérer les événements à venir d'un utilisateur")
    class GetUserUpcomingEventsTests {

        @Test
        @DisplayName("Devrait retourner tous les événements pour le propriétaire")
        void shouldReturnAllEventsForOwner() {
            // Given
            when(sportEventRepository.findByUserIdAndDateGreaterThanEqualOrderByDateAscStartTimeAsc(
                    eq(organizerId), any(LocalDate.class)))
                    .thenReturn(List.of(publicEvent, privateEvent));

            // When
            List<SportEventResponse> results = sportEventService.getUserUpcomingEvents(organizerId, organizerId);

            // Then
            assertThat(results).hasSize(2);
        }

        @Test
        @DisplayName("Devrait retourner seulement les événements publics pour un autre utilisateur")
        void shouldReturnOnlyPublicEventsForOtherUser() {
            // Given
            when(sportEventRepository.findByUserIdAndDateGreaterThanEqualOrderByDateAscStartTimeAsc(
                    eq(organizerId), any(LocalDate.class)))
                    .thenReturn(List.of(publicEvent, privateEvent));

            // When
            List<SportEventResponse> results = sportEventService.getUserUpcomingEvents(organizerId, participantId);

            // Then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getIsPublic()).isTrue();
        }
    }

    // =====================================================================
    // GET PUBLIC EVENTS TESTS
    // =====================================================================

    @Nested
    @DisplayName("Récupérer les événements publics")
    class GetPublicEventsTests {

        @Test
        @DisplayName("Devrait récupérer tous les événements publics")
        void shouldGetAllPublicEvents() {
            // Given
            when(sportEventRepository.findPublicEventsFromDate(any(LocalDate.class)))
                    .thenReturn(List.of(publicEvent));

            // When
            List<SportEventResponse> results = sportEventService.getPublicEvents();

            // Then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getSport()).isEqualTo("Football");

            verify(sportEventRepository).findPublicEventsFromDate(any(LocalDate.class));
        }

        @Test
        @DisplayName("Devrait récupérer les événements publics par sport")
        void shouldGetPublicEventsBySport() {
            // Given
            when(sportEventRepository.findPublicEventsBySportFromDate(eq("Football"), any(LocalDate.class)))
                    .thenReturn(List.of(publicEvent));

            // When
            List<SportEventResponse> results = sportEventService.getPublicEventsBySport("Football");

            // Then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getSport()).isEqualTo("Football");

            verify(sportEventRepository).findPublicEventsBySportFromDate(eq("Football"), any(LocalDate.class));
        }

        @Test
        @DisplayName("Devrait retourner une liste vide si aucun événement public par sport")
        void shouldReturnEmptyListWhenNoPublicEventsForSport() {
            // Given
            when(sportEventRepository.findPublicEventsBySportFromDate(eq("Rugby"), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            // When
            List<SportEventResponse> results = sportEventService.getPublicEventsBySport("Rugby");

            // Then
            assertThat(results).isEmpty();
        }
    }

    // =====================================================================
    // NEARBY EVENTS SEARCH TESTS
    // =====================================================================

    @Nested
    @DisplayName("Recherche d'événements à proximité")
    class SearchEventsNearbyTests {

        @Test
        @DisplayName("Devrait trouver les événements proches de la position de l'utilisateur")
        void shouldFindEventsNearUserLocation() {
            // Given - Event at Stade de France (48.9244, 2.3601), search from nearby (48.92, 2.36)
            when(sportEventRepository.findPublicEventsFromDate(any(LocalDate.class)))
                    .thenReturn(List.of(publicEvent));

            // When - Search within 5km
            List<SportEventResponse> results = sportEventService.searchEventsNearby(
                    48.92, 2.36, 5.0, null
            );

            // Then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getDistanceKm()).isNotNull();
            assertThat(results.get(0).getDistanceKm()).isLessThan(5.0);
        }

        @Test
        @DisplayName("Devrait filtrer les événements trop éloignés")
        void shouldFilterOutDistantEvents() {
            // Given - Event in Paris, search from Marseille (43.2965, 5.3698)
            when(sportEventRepository.findPublicEventsFromDate(any(LocalDate.class)))
                    .thenReturn(List.of(publicEvent));

            // When - Search within 10km (Paris is ~660km from Marseille)
            List<SportEventResponse> results = sportEventService.searchEventsNearby(
                    43.2965, 5.3698, 10.0, null
            );

            // Then
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("Devrait filtrer par sport et distance")
        void shouldFilterBySportAndDistance() {
            // Given
            when(sportEventRepository.findPublicEventsBySportFromDate(eq("Football"), any(LocalDate.class)))
                    .thenReturn(List.of(publicEvent));

            // When
            List<SportEventResponse> results = sportEventService.searchEventsNearby(
                    48.92, 2.36, 5.0, "Football"
            );

            // Then
            assertThat(results).hasSize(1);

            verify(sportEventRepository).findPublicEventsBySportFromDate(eq("Football"), any(LocalDate.class));
            verify(sportEventRepository, never()).findPublicEventsFromDate(any(LocalDate.class));
        }

        @Test
        @DisplayName("Devrait échouer si la latitude est nulle")
        void shouldFailWhenLatitudeIsNull() {
            // When/Then
            assertThatThrownBy(() -> sportEventService.searchEventsNearby(
                    null, 2.36, 5.0, null
            ))
                    .isInstanceOf(InvalidLocationException.class)
                    .hasMessage("La localisation est requise pour cette recherche");
        }

        @Test
        @DisplayName("Devrait échouer si la longitude est nulle")
        void shouldFailWhenLongitudeIsNull() {
            // When/Then
            assertThatThrownBy(() -> sportEventService.searchEventsNearby(
                    48.92, null, 5.0, null
            ))
                    .isInstanceOf(InvalidLocationException.class)
                    .hasMessage("La localisation est requise pour cette recherche");
        }

        @Test
        @DisplayName("Devrait ignorer les événements sans coordonnées GPS")
        void shouldIgnoreEventsWithoutCoordinates() {
            // Given - Event with no GPS coordinates
            SportEvent eventNoCoords = SportEvent.builder()
                    .id(UUID.randomUUID())
                    .user(organizer)
                    .sport("Football")
                    .title("Match sans GPS")
                    .date(LocalDate.now().plusDays(5))
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(16, 0))
                    .recurrence(SportEvent.RecurrenceType.NONE)
                    .isPublic(true)
                    .isPaid(false)
                    .latitude(null)
                    .longitude(null)
                    .participants(new ArrayList<>())
                    .build();

            when(sportEventRepository.findPublicEventsFromDate(any(LocalDate.class)))
                    .thenReturn(List.of(publicEvent, eventNoCoords));

            // When
            List<SportEventResponse> results = sportEventService.searchEventsNearby(
                    48.92, 2.36, 5.0, null
            );

            // Then - Only the event with coordinates should be returned
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getTitle()).isEqualTo("Match amical");
        }

        @Test
        @DisplayName("Devrait trier les résultats par distance croissante")
        void shouldSortResultsByDistanceAscending() {
            // Given - Two events at different distances
            SportEvent nearEvent = SportEvent.builder()
                    .id(UUID.randomUUID())
                    .user(organizer)
                    .sport("Tennis")
                    .title("Match proche")
                    .date(LocalDate.now().plusDays(5))
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(16, 0))
                    .recurrence(SportEvent.RecurrenceType.NONE)
                    .isPublic(true)
                    .isPaid(false)
                    .latitude(48.921)  // Very close
                    .longitude(2.361)
                    .participants(new ArrayList<>())
                    .build();

            SportEvent farEvent = SportEvent.builder()
                    .id(UUID.randomUUID())
                    .user(organizer)
                    .sport("Football")
                    .title("Match éloigné")
                    .date(LocalDate.now().plusDays(5))
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(16, 0))
                    .recurrence(SportEvent.RecurrenceType.NONE)
                    .isPublic(true)
                    .isPaid(false)
                    .latitude(48.95)  // Further away
                    .longitude(2.40)
                    .participants(new ArrayList<>())
                    .build();

            when(sportEventRepository.findPublicEventsFromDate(any(LocalDate.class)))
                    .thenReturn(List.of(farEvent, nearEvent));

            // When - Search within 10km from 48.92, 2.36
            List<SportEventResponse> results = sportEventService.searchEventsNearby(
                    48.92, 2.36, 10.0, null
            );

            // Then - Near event should come first
            assertThat(results).hasSize(2);
            assertThat(results.get(0).getDistanceKm()).isLessThan(results.get(1).getDistanceKm());
        }
    }

    // =====================================================================
    // PARTICIPATING EVENTS TESTS
    // =====================================================================

    @Nested
    @DisplayName("Récupérer les événements auxquels l'utilisateur participe")
    class GetParticipatingEventsTests {

        @Test
        @DisplayName("Devrait récupérer les événements de participation")
        void shouldGetParticipatingEvents() {
            // Given
            EventParticipant ep = EventParticipant.builder()
                    .id(UUID.randomUUID())
                    .event(publicEvent)
                    .user(participant)
                    .status(EventParticipant.ParticipantStatus.CONFIRMED)
                    .build();

            when(eventParticipantRepository.findByUserId(participantId))
                    .thenReturn(List.of(ep));

            // When
            List<SportEventResponse> results = sportEventService.getParticipatingEvents(participantId);

            // Then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getSport()).isEqualTo("Football");

            verify(eventParticipantRepository).findByUserId(participantId);
        }

        @Test
        @DisplayName("Devrait retourner une liste vide si aucune participation")
        void shouldReturnEmptyListWhenNoParticipation() {
            // Given
            when(eventParticipantRepository.findByUserId(participantId))
                    .thenReturn(Collections.emptyList());

            // When
            List<SportEventResponse> results = sportEventService.getParticipatingEvents(participantId);

            // Then
            assertThat(results).isEmpty();
        }
    }

    // =====================================================================
    // APPROVE PARTICIPANT TESTS
    // =====================================================================

    @Nested
    @DisplayName("Approuver un participant")
    class ApproveParticipantTests {

        private EventParticipant pendingParticipant;
        private UUID pendingParticipantId;

        @BeforeEach
        void setUp() {
            pendingParticipantId = UUID.randomUUID();
            pendingParticipant = EventParticipant.builder()
                    .id(pendingParticipantId)
                    .event(privateEvent)
                    .user(participant)
                    .status(EventParticipant.ParticipantStatus.PENDING)
                    .build();
        }

        @Test
        @DisplayName("Devrait approuver un participant avec succès")
        void shouldApproveParticipantSuccessfully() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(eventParticipantRepository.findById(pendingParticipantId)).thenReturn(Optional.of(pendingParticipant));
            when(eventParticipantRepository.countConfirmedByEventId(privateEventId)).thenReturn(1L);
            when(eventParticipantRepository.save(any(EventParticipant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            SportEventResponse response = sportEventService.approveParticipant(privateEventId, pendingParticipantId, organizerId);

            // Then
            assertThat(response).isNotNull();

            verify(eventParticipantRepository).save(argThat(ep ->
                    ep.getStatus() == EventParticipant.ParticipantStatus.CONFIRMED
            ));
        }

        @Test
        @DisplayName("Devrait échouer si un non-organisateur essaie d'approuver")
        void shouldFailWhenNonOrganizerApproves() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));

            // When/Then
            assertThatThrownBy(() -> sportEventService.approveParticipant(privateEventId, pendingParticipantId, participantId))
                    .isInstanceOf(UnauthorizedEventAccessException.class)
                    .hasMessage("Seul l'organisateur peut approuver les participants");

            verify(eventParticipantRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait échouer si l'événement est complet lors de l'approbation")
        void shouldFailWhenEventFullOnApproval() {
            // Given
            UUID privateEventId = privateEvent.getId();
            privateEvent.setMaxParticipants(2);

            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(eventParticipantRepository.findById(pendingParticipantId)).thenReturn(Optional.of(pendingParticipant));
            when(eventParticipantRepository.countConfirmedByEventId(privateEventId)).thenReturn(2L);

            // When/Then
            assertThatThrownBy(() -> sportEventService.approveParticipant(privateEventId, pendingParticipantId, organizerId))
                    .isInstanceOf(EventFullException.class);

            verify(eventParticipantRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait échouer si le participant n'existe pas")
        void shouldFailWhenParticipantNotFound() {
            // Given
            UUID privateEventId = privateEvent.getId();
            UUID unknownParticipantId = UUID.randomUUID();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(eventParticipantRepository.findById(unknownParticipantId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.approveParticipant(privateEventId, unknownParticipantId, organizerId))
                    .isInstanceOf(ParticipantNotFoundException.class);
        }

        @Test
        @DisplayName("Devrait échouer si le participant n'appartient pas à cet événement")
        void shouldFailWhenParticipantBelongsToDifferentEvent() {
            // Given
            UUID privateEventId = privateEvent.getId();
            SportEvent otherEvent = SportEvent.builder()
                    .id(UUID.randomUUID())
                    .user(organizer)
                    .build();

            EventParticipant wrongEventParticipant = EventParticipant.builder()
                    .id(pendingParticipantId)
                    .event(otherEvent)
                    .user(participant)
                    .status(EventParticipant.ParticipantStatus.PENDING)
                    .build();

            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(eventParticipantRepository.findById(pendingParticipantId)).thenReturn(Optional.of(wrongEventParticipant));

            // When/Then
            assertThatThrownBy(() -> sportEventService.approveParticipant(privateEventId, pendingParticipantId, organizerId))
                    .isInstanceOf(ParticipantNotFoundException.class);
        }
    }

    // =====================================================================
    // REJECT PARTICIPANT TESTS
    // =====================================================================

    @Nested
    @DisplayName("Rejeter un participant")
    class RejectParticipantTests {

        private EventParticipant pendingParticipant;
        private UUID pendingParticipantId;

        @BeforeEach
        void setUp() {
            pendingParticipantId = UUID.randomUUID();
            pendingParticipant = EventParticipant.builder()
                    .id(pendingParticipantId)
                    .event(privateEvent)
                    .user(participant)
                    .status(EventParticipant.ParticipantStatus.PENDING)
                    .build();
        }

        @Test
        @DisplayName("Devrait rejeter un participant avec succès")
        void shouldRejectParticipantSuccessfully() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(eventParticipantRepository.findById(pendingParticipantId)).thenReturn(Optional.of(pendingParticipant));
            when(eventParticipantRepository.save(any(EventParticipant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            SportEventResponse response = sportEventService.rejectParticipant(privateEventId, pendingParticipantId, organizerId);

            // Then
            assertThat(response).isNotNull();

            verify(eventParticipantRepository).save(argThat(ep ->
                    ep.getStatus() == EventParticipant.ParticipantStatus.DECLINED
            ));
        }

        @Test
        @DisplayName("Devrait échouer si un non-organisateur essaie de rejeter")
        void shouldFailWhenNonOrganizerRejects() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));

            // When/Then
            assertThatThrownBy(() -> sportEventService.rejectParticipant(privateEventId, pendingParticipantId, participantId))
                    .isInstanceOf(UnauthorizedEventAccessException.class)
                    .hasMessage("Seul l'organisateur peut rejeter les participants");

            verify(eventParticipantRepository, never()).save(any());
        }

        @Test
        @DisplayName("Devrait échouer si le participant n'existe pas")
        void shouldFailWhenParticipantNotFound() {
            // Given
            UUID privateEventId = privateEvent.getId();
            UUID unknownId = UUID.randomUUID();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(eventParticipantRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.rejectParticipant(privateEventId, unknownId, organizerId))
                    .isInstanceOf(ParticipantNotFoundException.class);
        }

        @Test
        @DisplayName("Devrait échouer si le participant n'appartient pas à cet événement")
        void shouldFailWhenParticipantBelongsToDifferentEvent() {
            // Given
            UUID privateEventId = privateEvent.getId();
            SportEvent otherEvent = SportEvent.builder()
                    .id(UUID.randomUUID())
                    .user(organizer)
                    .build();

            EventParticipant wrongEventParticipant = EventParticipant.builder()
                    .id(pendingParticipantId)
                    .event(otherEvent)
                    .user(participant)
                    .status(EventParticipant.ParticipantStatus.PENDING)
                    .build();

            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(eventParticipantRepository.findById(pendingParticipantId)).thenReturn(Optional.of(wrongEventParticipant));

            // When/Then
            assertThatThrownBy(() -> sportEventService.rejectParticipant(privateEventId, pendingParticipantId, organizerId))
                    .isInstanceOf(ParticipantNotFoundException.class);
        }
    }

    // =====================================================================
    // GET PENDING PARTICIPANTS TESTS
    // =====================================================================

    @Nested
    @DisplayName("Récupérer les participants en attente")
    class GetPendingParticipantsTests {

        @Test
        @DisplayName("Devrait récupérer les participants en attente pour l'organisateur")
        void shouldGetPendingParticipantsForOrganizer() {
            // Given
            UUID privateEventId = privateEvent.getId();
            EventParticipant pending = EventParticipant.builder()
                    .id(UUID.randomUUID())
                    .event(privateEvent)
                    .user(participant)
                    .status(EventParticipant.ParticipantStatus.PENDING)
                    .build();

            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(eventParticipantRepository.findPendingByEventId(privateEventId)).thenReturn(List.of(pending));

            // When
            List<EventParticipant> results = sportEventService.getPendingParticipants(privateEventId, organizerId);

            // Then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getStatus()).isEqualTo(EventParticipant.ParticipantStatus.PENDING);

            verify(eventParticipantRepository).findPendingByEventId(privateEventId);
        }

        @Test
        @DisplayName("Devrait échouer si un non-organisateur essaie de voir les demandes en attente")
        void shouldFailWhenNonOrganizerRequests() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));

            // When/Then
            assertThatThrownBy(() -> sportEventService.getPendingParticipants(privateEventId, participantId))
                    .isInstanceOf(UnauthorizedEventAccessException.class)
                    .hasMessage("Seul l'organisateur peut voir les demandes en attente");

            verify(eventParticipantRepository, never()).findPendingByEventId(any());
        }

        @Test
        @DisplayName("Devrait retourner une liste vide si aucun participant en attente")
        void shouldReturnEmptyListWhenNoPendingParticipants() {
            // Given
            UUID privateEventId = privateEvent.getId();
            when(sportEventRepository.findById(privateEventId)).thenReturn(Optional.of(privateEvent));
            when(eventParticipantRepository.findPendingByEventId(privateEventId)).thenReturn(Collections.emptyList());

            // When
            List<EventParticipant> results = sportEventService.getPendingParticipants(privateEventId, organizerId);

            // Then
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("Devrait échouer si l'événement n'existe pas")
        void shouldFailWhenEventNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(sportEventRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> sportEventService.getPendingParticipants(unknownId, organizerId))
                    .isInstanceOf(EventNotFoundException.class);
        }
    }
}

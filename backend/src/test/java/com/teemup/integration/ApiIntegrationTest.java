package com.teemup.integration;

import com.corundumstudio.socketio.SocketIOServer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teemup.dto.auth.LoginRequest;
import com.teemup.dto.auth.RefreshTokenRequest;
import com.teemup.dto.auth.RegisterRequest;
import com.teemup.dto.event.CreateSportEventRequest;
import com.teemup.dto.user.UpdateUserRequest;
import com.teemup.dto.verification.FaceVerificationResponse;
import com.teemup.config.RateLimitFilter;
import com.teemup.service.FaceVerificationService;
import com.teemup.websocket.SocketIOService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive integration tests for the TeemUp API.
 *
 * These tests exercise the full HTTP request-response cycle through real controllers,
 * real security filters, and a real H2 in-memory database. Only external services
 * (face verification, SocketIO) are mocked.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Mock external services that cannot run in test environment
    @MockBean
    private FaceVerificationService faceVerificationService;

    @MockBean
    private SocketIOServer socketIOServer;

    @MockBean
    private SocketIOService socketIOService;

    @MockBean
    private RateLimitFilter rateLimitFilter;

    /** A valid password that satisfies all constraints: 8+ chars, upper, lower, digit, special. */
    private static final String VALID_PASSWORD = "Test@1234";

    /** A base64 placeholder image for face verification requests. */
    private static final String FAKE_BASE64_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk";

    @BeforeEach
    void setUpFaceVerificationMock() {
        FaceVerificationResponse successfulVerification = FaceVerificationResponse.builder()
                .success(true)
                .faceDetected(true)
                .age(25)
                .ageRange("25-29")
                .gender("male")
                .genderConfidence(0.98)
                .isAdult(true)
                .isRealFace(true)
                .message("Verification successful")
                .build();

        when(faceVerificationService.verifyFace(anyString())).thenReturn(successfulVerification);
        when(faceVerificationService.isEligibleForRegistration(successfulVerification)).thenCallRealMethod();

        // Disable rate limiting in integration tests - pass all requests through
        try {
            doAnswer(invocation -> {
                FilterChain chain = invocation.getArgument(2);
                chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
                return null;
            }).when(rateLimitFilter).doFilter(any(ServletRequest.class), any(ServletResponse.class), any(FilterChain.class));
        } catch (Exception ignored) { }
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    /**
     * Register a new user and return the parsed JSON response containing tokens and user data.
     */
    private JsonNode registerUser(String email, String password, String firstName, String lastName) throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(email);
        request.setPassword(password);
        request.setFirstName(firstName);
        request.setLastName(lastName);
        request.setVerificationImage(FAKE_BASE64_IMAGE);

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    /**
     * Login with credentials and return the parsed JSON response containing tokens and user data.
     */
    private JsonNode loginUser(String email, String password) throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email(email)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    /**
     * Format an access token into a Bearer Authorization header value.
     */
    private String getAuthHeader(String accessToken) {
        return "Bearer " + accessToken;
    }

    /**
     * Extract the access token string from a parsed auth response.
     */
    private String extractAccessToken(JsonNode authResponse) {
        return authResponse.get("accessToken").asText();
    }

    /**
     * Extract the refresh token string from a parsed auth response.
     */
    private String extractRefreshToken(JsonNode authResponse) {
        return authResponse.get("refreshToken").asText();
    }

    /**
     * Extract the user ID string from a parsed auth response.
     */
    private String extractUserId(JsonNode authResponse) {
        return authResponse.get("user").get("id").asText();
    }

    /**
     * Create a sport event and return the parsed JSON response.
     */
    private JsonNode createEvent(String accessToken, CreateSportEventRequest request) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/events")
                        .header("Authorization", getAuthHeader(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    /**
     * Build a default valid event request for tomorrow.
     */
    private CreateSportEventRequest buildDefaultEventRequest() {
        CreateSportEventRequest request = new CreateSportEventRequest();
        request.setSport("Football");
        request.setTitle("Sunday Match");
        request.setDescription("Friendly football game at the park");
        request.setLocation("Central Park, Paris");
        request.setLatitude(48.8566);
        request.setLongitude(2.3522);
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(12, 0));
        request.setRecurrence("NONE");
        request.setIsPublic(true);
        request.setMaxParticipants(10);
        request.setIsPaid(false);
        return request;
    }

    // =========================================================================
    // 1. Auth Flow Tests
    // =========================================================================

    @Nested
    @DisplayName("1. Auth Flow")
    class AuthFlowTests {

        @Test
        @DisplayName("POST /api/auth/register - registers a new user and returns tokens")
        void registerNewUser() throws Exception {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("newuser@test.com");
            request.setPassword(VALID_PASSWORD);
            request.setFirstName("John");
            request.setLastName("Doe");
            request.setVerificationImage(FAKE_BASE64_IMAGE);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.expiresIn").isNumber())
                    .andExpect(jsonPath("$.user.email").value("newuser@test.com"))
                    .andExpect(jsonPath("$.user.firstName").value("John"))
                    .andExpect(jsonPath("$.user.lastName").value("Doe"))
                    .andExpect(jsonPath("$.user.fullName").value("John Doe"))
                    .andExpect(jsonPath("$.user.id").isNotEmpty())
                    .andExpect(jsonPath("$.user.id").isNotEmpty());
        }

        @Test
        @DisplayName("POST /api/auth/login - logs in with valid credentials")
        void loginWithValidCredentials() throws Exception {
            // First register a user
            registerUser("login@test.com", VALID_PASSWORD, "Alice", "Smith");

            // Then login
            LoginRequest loginRequest = LoginRequest.builder()
                    .email("login@test.com")
                    .password(VALID_PASSWORD)
                    .build();

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.user.email").value("login@test.com"))
                    .andExpect(jsonPath("$.user.firstName").value("Alice"))
                    .andExpect(jsonPath("$.user.isOnline").value(true));
        }

        @Test
        @DisplayName("POST /api/auth/refresh - refreshes access token with valid refresh token")
        void refreshToken() throws Exception {
            // Register to get initial tokens
            JsonNode authResponse = registerUser("refresh@test.com", VALID_PASSWORD, "Bob", "Brown");
            String refreshToken = extractRefreshToken(authResponse);

            RefreshTokenRequest refreshRequest = RefreshTokenRequest.builder()
                    .refreshToken(refreshToken)
                    .build();

            mockMvc.perform(post("/api/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(refreshRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.user.email").value("refresh@test.com"));
        }

        @Test
        @DisplayName("GET /api/users/me - returns 401 without token")
        void accessProtectedEndpointWithoutToken() throws Exception {
            mockMvc.perform(get("/api/users/me")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());
        }
    }

    // =========================================================================
    // 2. User Flow Tests
    // =========================================================================

    @Nested
    @DisplayName("2. User Flow")
    class UserFlowTests {

        @Test
        @DisplayName("GET /api/auth/me - returns current user profile with JWT token")
        void getCurrentUserProfile() throws Exception {
            JsonNode authResponse = registerUser("profile@test.com", VALID_PASSWORD, "Charlie", "Wilson");
            String accessToken = extractAccessToken(authResponse);

            mockMvc.perform(get("/api/auth/me")
                            .header("Authorization", getAuthHeader(accessToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("profile@test.com"))
                    .andExpect(jsonPath("$.firstName").value("Charlie"))
                    .andExpect(jsonPath("$.lastName").value("Wilson"))
                    .andExpect(jsonPath("$.fullName").value("Charlie Wilson"))
                    .andExpect(jsonPath("$.id").isNotEmpty())
                    .andExpect(jsonPath("$.id").isNotEmpty());
        }

        @Test
        @DisplayName("PUT /api/users/me - updates current user profile")
        void updateUserProfile() throws Exception {
            JsonNode authResponse = registerUser("update@test.com", VALID_PASSWORD, "Diana", "Clark");
            String accessToken = extractAccessToken(authResponse);

            UpdateUserRequest updateRequest = UpdateUserRequest.builder()
                    .bio("I love tennis and swimming!")
                    .sports(Set.of("Tennis", "Swimming"))
                    .firstName("Diana-Updated")
                    .latitude(48.8566)
                    .longitude(2.3522)
                    .onboardingCompleted(true)
                    .build();

            mockMvc.perform(put("/api/users/me")
                            .header("Authorization", getAuthHeader(accessToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.firstName").value("Diana-Updated"))
                    .andExpect(jsonPath("$.bio").value("I love tennis and swimming!"))
                    .andExpect(jsonPath("$.sports", hasSize(2)))
                    .andExpect(jsonPath("$.sports", containsInAnyOrder("Tennis", "Swimming")))
                    .andExpect(jsonPath("$.latitude").value(48.8566))
                    .andExpect(jsonPath("$.longitude").value(2.3522))
                    .andExpect(jsonPath("$.onboardingCompleted").value(true));
        }

        @Test
        @DisplayName("GET /api/users/search?query=... - searches users by name or email")
        void searchUsers() throws Exception {
            // Register some users to search for
            registerUser("searchable@test.com", VALID_PASSWORD, "Edward", "Unique");
            JsonNode authResponse = registerUser("searcher@test.com", VALID_PASSWORD, "Fiona", "Finder");
            String accessToken = extractAccessToken(authResponse);

            // Search by first name (search endpoint is authenticated)
            mockMvc.perform(get("/api/users/search")
                            .param("query", "Edward")
                            .header("Authorization", getAuthHeader(accessToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$[0].firstName").value("Edward"))
                    .andExpect(jsonPath("$[0].lastName").value("Unique"))
                    .andExpect(jsonPath("$[0].fullName").value("Edward Unique"))
                    // PublicUserResponse does not include email
                    .andExpect(jsonPath("$[0].email").doesNotExist());
        }
    }

    // =========================================================================
    // 3. Sport Events Flow Tests
    // =========================================================================

    @Nested
    @DisplayName("3. Sport Events Flow")
    class SportEventsFlowTests {

        @Test
        @DisplayName("POST /api/events - creates a new sport event")
        void shouldCreateEvent() throws Exception {
            JsonNode authResponse = registerUser("organizer@test.com", VALID_PASSWORD, "George", "Hall");
            String accessToken = extractAccessToken(authResponse);

            CreateSportEventRequest eventRequest = buildDefaultEventRequest();

            mockMvc.perform(post("/api/events")
                            .header("Authorization", getAuthHeader(accessToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(eventRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").isNotEmpty())
                    .andExpect(jsonPath("$.sport").value("Football"))
                    .andExpect(jsonPath("$.title").value("Sunday Match"))
                    .andExpect(jsonPath("$.description").value("Friendly football game at the park"))
                    .andExpect(jsonPath("$.location").value("Central Park, Paris"))
                    .andExpect(jsonPath("$.latitude").value(48.8566))
                    .andExpect(jsonPath("$.longitude").value(2.3522))
                    .andExpect(jsonPath("$.recurrence").value("NONE"))
                    .andExpect(jsonPath("$.isPublic").value(true))
                    .andExpect(jsonPath("$.maxParticipants").value(10))
                    .andExpect(jsonPath("$.isPaid").value(false))
                    .andExpect(jsonPath("$.organizer.firstName").value("George"));
        }

        @Test
        @DisplayName("GET /api/events/public - retrieves public events")
        void getPublicEvents() throws Exception {
            // Create a user and an event
            JsonNode authResponse = registerUser("public-events@test.com", VALID_PASSWORD, "Helen", "King");
            String accessToken = extractAccessToken(authResponse);

            CreateSportEventRequest eventRequest = buildDefaultEventRequest();
            createEvent(accessToken, eventRequest);

            // Public events endpoint is permitAll - no auth needed
            mockMvc.perform(get("/api/events/public")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.content[0].sport").value("Football"))
                    .andExpect(jsonPath("$.content[0].isPublic").value(true));
        }

        @Test
        @DisplayName("GET /api/events/{id} - retrieves event by ID with details")
        void getEventById() throws Exception {
            JsonNode authResponse = registerUser("get-event@test.com", VALID_PASSWORD, "Ivan", "Lewis");
            String accessToken = extractAccessToken(authResponse);

            CreateSportEventRequest eventRequest = buildDefaultEventRequest();
            JsonNode eventResponse = createEvent(accessToken, eventRequest);
            String eventId = eventResponse.get("id").asText();

            mockMvc.perform(get("/api/events/{eventId}", eventId)
                            .header("Authorization", getAuthHeader(accessToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(eventId))
                    .andExpect(jsonPath("$.sport").value("Football"))
                    .andExpect(jsonPath("$.title").value("Sunday Match"))
                    .andExpect(jsonPath("$.organizer.firstName").value("Ivan"))
                    .andExpect(jsonPath("$.participantCount").isNumber())
                    .andExpect(jsonPath("$.isParticipating").isBoolean());
        }

        @Test
        @DisplayName("POST /api/events/{id}/join - second user joins another user's event")
        void joinEvent() throws Exception {
            // Register organizer and create event
            JsonNode organizerAuth = registerUser("event-organizer@test.com", VALID_PASSWORD, "Julia", "Moore");
            String organizerToken = extractAccessToken(organizerAuth);

            CreateSportEventRequest eventRequest = buildDefaultEventRequest();
            JsonNode eventResponse = createEvent(organizerToken, eventRequest);
            String eventId = eventResponse.get("id").asText();

            // Register second user
            JsonNode participantAuth = registerUser("event-joiner@test.com", VALID_PASSWORD, "Kevin", "Nelson");
            String participantToken = extractAccessToken(participantAuth);

            // Second user joins the event
            MvcResult joinResult = mockMvc.perform(post("/api/events/{eventId}/join", eventId)
                            .header("Authorization", getAuthHeader(participantToken)))
                    .andReturn();
            // Debug: print response if not 200
            if (joinResult.getResponse().getStatus() != 200) {
                System.err.println("JOIN FAILED: " + joinResult.getResponse().getStatus() + " - " + joinResult.getResponse().getContentAsString());
            }
            org.assertj.core.api.Assertions.assertThat(joinResult.getResponse().getStatus()).isEqualTo(200);
        }

        @Test
        @DisplayName("DELETE /api/events/{id} - organizer deletes their event")
        void deleteEvent() throws Exception {
            JsonNode authResponse = registerUser("delete-event@test.com", VALID_PASSWORD, "Laura", "Owen");
            String accessToken = extractAccessToken(authResponse);

            CreateSportEventRequest eventRequest = buildDefaultEventRequest();
            JsonNode eventResponse = createEvent(accessToken, eventRequest);
            String eventId = eventResponse.get("id").asText();

            // Delete the event
            mockMvc.perform(delete("/api/events/{eventId}", eventId)
                            .header("Authorization", getAuthHeader(accessToken)))
                    .andExpect(status().isNoContent());

            // Verify it is gone
            mockMvc.perform(get("/api/events/{eventId}", eventId)
                            .header("Authorization", getAuthHeader(accessToken)))
                    .andExpect(status().isNotFound());
        }
    }

    // =========================================================================
    // 4. Friend Flow Tests
    // =========================================================================

    @Nested
    @DisplayName("4. Friend Flow")
    class FriendFlowTests {

        @Test
        @DisplayName("POST /api/friends/request/{receiverId} - sends a friend request")
        void sendFriendRequest() throws Exception {
            JsonNode senderAuth = registerUser("sender@test.com", VALID_PASSWORD, "Mike", "Parker");
            String senderToken = extractAccessToken(senderAuth);

            JsonNode receiverAuth = registerUser("receiver@test.com", VALID_PASSWORD, "Nancy", "Quinn");
            String receiverId = extractUserId(receiverAuth);

            mockMvc.perform(post("/api/friends/request/{receiverId}", receiverId)
                            .header("Authorization", getAuthHeader(senderToken)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").isNotEmpty())
                    .andExpect(jsonPath("$.status").value("PENDING"))
                    .andExpect(jsonPath("$.sender.firstName").value("Mike"))
                    .andExpect(jsonPath("$.sender.lastName").value("Parker"))
                    .andExpect(jsonPath("$.receiver.firstName").value("Nancy"))
                    .andExpect(jsonPath("$.receiver.lastName").value("Quinn"));
        }

        @Test
        @DisplayName("POST /api/friends/accept/{requestId} - accepts a friend request")
        void acceptFriendRequest() throws Exception {
            // Register two users
            JsonNode senderAuth = registerUser("accept-sender@test.com", VALID_PASSWORD, "Oscar", "Rogers");
            String senderToken = extractAccessToken(senderAuth);

            JsonNode receiverAuth = registerUser("accept-receiver@test.com", VALID_PASSWORD, "Patty", "Stone");
            String receiverToken = extractAccessToken(receiverAuth);
            String receiverId = extractUserId(receiverAuth);

            // Send friend request
            MvcResult sendResult = mockMvc.perform(post("/api/friends/request/{receiverId}", receiverId)
                            .header("Authorization", getAuthHeader(senderToken)))
                    .andExpect(status().isCreated())
                    .andReturn();

            JsonNode requestResponse = objectMapper.readTree(sendResult.getResponse().getContentAsString());
            String requestId = requestResponse.get("id").asText();

            // Accept the request as receiver
            mockMvc.perform(post("/api/friends/accept/{requestId}", requestId)
                            .header("Authorization", getAuthHeader(receiverToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(requestId))
                    .andExpect(jsonPath("$.status").value("ACCEPTED"))
                    .andExpect(jsonPath("$.sender.firstName").value("Oscar"))
                    .andExpect(jsonPath("$.receiver.firstName").value("Patty"));

            // Verify they are now friends by checking the friend list
            mockMvc.perform(get("/api/users/friends")
                            .header("Authorization", getAuthHeader(receiverToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].firstName").value("Oscar"));
        }

        @Test
        @DisplayName("GET /api/friends/requests/received - returns pending received requests")
        void getPendingReceivedRequests() throws Exception {
            // Register users
            JsonNode senderAuth = registerUser("pending-sender@test.com", VALID_PASSWORD, "Ray", "Turner");
            String senderToken = extractAccessToken(senderAuth);

            JsonNode receiverAuth = registerUser("pending-receiver@test.com", VALID_PASSWORD, "Sarah", "Underwood");
            String receiverToken = extractAccessToken(receiverAuth);
            String receiverId = extractUserId(receiverAuth);

            // Send friend request
            mockMvc.perform(post("/api/friends/request/{receiverId}", receiverId)
                            .header("Authorization", getAuthHeader(senderToken)))
                    .andExpect(status().isCreated());

            // Check pending received requests
            mockMvc.perform(get("/api/friends/requests/received")
                            .header("Authorization", getAuthHeader(receiverToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].status").value("PENDING"))
                    .andExpect(jsonPath("$[0].sender.firstName").value("Ray"))
                    .andExpect(jsonPath("$[0].sender.lastName").value("Turner"))
                    .andExpect(jsonPath("$[0].receiver.firstName").value("Sarah"));
        }
    }

    // =========================================================================
    // 5. Security Tests
    // =========================================================================

    @Nested
    @DisplayName("5. Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("Authenticated endpoints return 403 without a token")
        void protectedEndpointWithoutToken_returns403() throws Exception {
            mockMvc.perform(get("/api/events/me"))
                    .andExpect(status().isForbidden());

            mockMvc.perform(put("/api/users/me")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());

            mockMvc.perform(get("/api/friends/requests/received"))
                    .andExpect(status().isForbidden());

            mockMvc.perform(post("/api/events")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Deleting another user's event returns 403")
        void deleteOtherUsersEvent_returns403() throws Exception {
            // Create organizer and their event
            JsonNode organizerAuth = registerUser("sec-organizer@test.com", VALID_PASSWORD, "Tom", "Victor");
            String organizerToken = extractAccessToken(organizerAuth);

            CreateSportEventRequest eventRequest = buildDefaultEventRequest();
            JsonNode eventResponse = createEvent(organizerToken, eventRequest);
            String eventId = eventResponse.get("id").asText();

            // Create a different user
            JsonNode otherAuth = registerUser("sec-other@test.com", VALID_PASSWORD, "Uma", "Walker");
            String otherToken = extractAccessToken(otherAuth);

            // Try to delete the organizer's event as the other user
            mockMvc.perform(delete("/api/events/{eventId}", eventId)
                            .header("Authorization", getAuthHeader(otherToken)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("UNAUTHORIZED_EVENT_ACCESS"));
        }

        @Test
        @DisplayName("Login with wrong password returns 401")
        void loginWithWrongPassword_returns401() throws Exception {
            // Register a user
            registerUser("wrong-pw@test.com", VALID_PASSWORD, "Wendy", "Xander");

            // Try to login with wrong password
            LoginRequest loginRequest = LoginRequest.builder()
                    .email("wrong-pw@test.com")
                    .password("WrongPassword@123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("BAD_CREDENTIALS"));
        }
    }

    // =========================================================================
    // 6. Validation Tests
    // =========================================================================

    @Nested
    @DisplayName("6. Validation Tests")
    class ValidationTests {

        @Test
        @DisplayName("Registration with invalid email returns 400 with validation errors")
        void registerWithInvalidEmail_returns400() throws Exception {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("not-an-email");
            request.setPassword(VALID_PASSWORD);
            request.setFirstName("Test");
            request.setLastName("User");
            request.setVerificationImage(FAKE_BASE64_IMAGE);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors.email").isNotEmpty());
        }

        @Test
        @DisplayName("Registration with weak password returns 400 with validation errors")
        void registerWithWeakPassword_returns400() throws Exception {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("weak-pw@test.com");
            request.setPassword("weak"); // Too short, no uppercase, no digit, no special
            request.setFirstName("Test");
            request.setLastName("User");
            request.setVerificationImage(FAKE_BASE64_IMAGE);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors.password").isNotEmpty());
        }

        @Test
        @DisplayName("Registration with duplicate email returns 409")
        void registerDuplicateEmail_returns409() throws Exception {
            // Register first
            registerUser("duplicate@test.com", VALID_PASSWORD, "First", "User");

            // Try to register again with same email
            RegisterRequest request = new RegisterRequest();
            request.setEmail("duplicate@test.com");
            request.setPassword(VALID_PASSWORD);
            request.setFirstName("Second");
            request.setLastName("User");
            request.setVerificationImage(FAKE_BASE64_IMAGE);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("EMAIL_EXISTS"));
        }

        @Test
        @DisplayName("Creating event without required fields returns 400")
        void createEventMissingFields_returns400() throws Exception {
            JsonNode authResponse = registerUser("event-validation@test.com", VALID_PASSWORD, "Val", "Test");
            String accessToken = extractAccessToken(authResponse);

            // Empty event request - missing sport, date, startTime, endTime
            CreateSportEventRequest request = new CreateSportEventRequest();

            mockMvc.perform(post("/api/events")
                            .header("Authorization", getAuthHeader(accessToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors.sport").isNotEmpty())
                    .andExpect(jsonPath("$.errors.date").isNotEmpty())
                    .andExpect(jsonPath("$.errors.startTime").isNotEmpty())
                    .andExpect(jsonPath("$.errors.endTime").isNotEmpty());
        }

        @Test
        @DisplayName("Organizer cannot join their own event")
        void organizerCannotJoinOwnEvent() throws Exception {
            JsonNode authResponse = registerUser("self-join@test.com", VALID_PASSWORD, "Sam", "Self");
            String accessToken = extractAccessToken(authResponse);

            CreateSportEventRequest eventRequest = buildDefaultEventRequest();
            JsonNode eventResponse = createEvent(accessToken, eventRequest);
            String eventId = eventResponse.get("id").asText();

            mockMvc.perform(post("/api/events/{eventId}/join", eventId)
                            .header("Authorization", getAuthHeader(accessToken)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("CANNOT_JOIN_OWN_EVENT"));
        }
    }

    // =========================================================================
    // 7. Cross-Cutting Integration Tests
    // =========================================================================

    @Nested
    @DisplayName("7. Cross-Cutting Integration Tests")
    class CrossCuttingTests {

        @Test
        @DisplayName("Full user lifecycle: register, update profile, create event, friend, join")
        void fullUserLifecycle() throws Exception {
            // Step 1: Register user A
            JsonNode userAAuth = registerUser("lifecycle-a@test.com", VALID_PASSWORD, "Adam", "Alpha");
            String userAToken = extractAccessToken(userAAuth);
            String userAId = extractUserId(userAAuth);

            // Step 2: Register user B
            JsonNode userBAuth = registerUser("lifecycle-b@test.com", VALID_PASSWORD, "Beth", "Beta");
            String userBToken = extractAccessToken(userBAuth);
            String userBId = extractUserId(userBAuth);

            // Step 3: User A updates profile
            UpdateUserRequest updateA = UpdateUserRequest.builder()
                    .bio("Sports enthusiast")
                    .sports(Set.of("Football", "Tennis"))
                    .onboardingCompleted(true)
                    .build();

            mockMvc.perform(put("/api/users/me")
                            .header("Authorization", getAuthHeader(userAToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateA)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bio").value("Sports enthusiast"))
                    .andExpect(jsonPath("$.onboardingCompleted").value(true));

            // Step 4: User A creates an event
            CreateSportEventRequest eventRequest = buildDefaultEventRequest();
            JsonNode eventResponse = createEvent(userAToken, eventRequest);
            String eventId = eventResponse.get("id").asText();

            // Step 5: User B sends friend request to User A
            MvcResult friendResult = mockMvc.perform(post("/api/friends/request/{receiverId}", userAId)
                            .header("Authorization", getAuthHeader(userBToken)))
                    .andExpect(status().isCreated())
                    .andReturn();

            JsonNode friendResponse = objectMapper.readTree(friendResult.getResponse().getContentAsString());
            String requestId = friendResponse.get("id").asText();

            // Step 6: User A accepts the friend request
            mockMvc.perform(post("/api/friends/accept/{requestId}", requestId)
                            .header("Authorization", getAuthHeader(userAToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ACCEPTED"));

            // Step 7: User B joins User A's event
            mockMvc.perform(post("/api/events/{eventId}/join", eventId)
                            .header("Authorization", getAuthHeader(userBToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.participantCount").value(1))
                    .andExpect(jsonPath("$.isParticipating").value(true));

            // Step 8: Verify User B can see User A's event by ID
            mockMvc.perform(get("/api/events/{eventId}", eventId)
                            .header("Authorization", getAuthHeader(userBToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.organizer.firstName").value("Adam"))
                    .andExpect(jsonPath("$.isParticipating").value(true));

            // Step 9: Verify they appear in each other's friend lists
            mockMvc.perform(get("/api/users/friends")
                            .header("Authorization", getAuthHeader(userAToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].firstName").value("Beth"));

            mockMvc.perform(get("/api/users/friends")
                            .header("Authorization", getAuthHeader(userBToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].firstName").value("Adam"));
        }

        @Test
        @DisplayName("User can view own profile via /api/users/{id} with full data including email")
        void viewOwnProfileReturnsFullData() throws Exception {
            JsonNode authResponse = registerUser("own-profile@test.com", VALID_PASSWORD, "Owen", "Profile");
            String accessToken = extractAccessToken(authResponse);
            String userId = extractUserId(authResponse);

            mockMvc.perform(get("/api/users/{userId}", userId)
                            .header("Authorization", getAuthHeader(accessToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("own-profile@test.com"))
                    .andExpect(jsonPath("$.firstName").value("Owen"));
        }

        @Test
        @DisplayName("User views another user's profile via /api/users/{id} - gets public data only (no email)")
        void viewOtherUserProfileReturnsPublicData() throws Exception {
            JsonNode user1Auth = registerUser("viewer@test.com", VALID_PASSWORD, "Viewer", "One");
            String viewerToken = extractAccessToken(user1Auth);

            JsonNode user2Auth = registerUser("target@test.com", VALID_PASSWORD, "Target", "Two");
            String targetId = extractUserId(user2Auth);

            mockMvc.perform(get("/api/users/{userId}", targetId)
                            .header("Authorization", getAuthHeader(viewerToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.firstName").value("Target"))
                    .andExpect(jsonPath("$.lastName").value("Two"))
                    // PublicUserResponse does not expose email
                    .andExpect(jsonPath("$.email").doesNotExist());
        }

        @Test
        @DisplayName("Accessing a non-existent event returns 404")
        void getNonExistentEvent_returns404() throws Exception {
            JsonNode authResponse = registerUser("notfound@test.com", VALID_PASSWORD, "Nobody", "Here");
            String accessToken = extractAccessToken(authResponse);

            String fakeEventId = UUID.randomUUID().toString();

            mockMvc.perform(get("/api/events/{eventId}", fakeEventId)
                            .header("Authorization", getAuthHeader(accessToken)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("EVENT_NOT_FOUND"));
        }
    }
}

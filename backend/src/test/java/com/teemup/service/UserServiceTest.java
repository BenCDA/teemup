package com.teemup.service;

import com.teemup.dto.user.PublicUserResponse;
import com.teemup.dto.user.UpdateUserRequest;
import com.teemup.dto.user.UserResponse;
import com.teemup.entity.User;
import com.teemup.exception.UserNotFoundException;
import com.teemup.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = User.builder()
                .id(testUserId)
                .email("test@example.com")
                .password("encodedPassword")
                .firstName("John")
                .lastName("Doe")
                .bio("Test bio")
                .sports(new HashSet<>(Set.of("Running", "Swimming")))
                .provider(User.AuthProvider.LOCAL)
                .isActive(true)
                .isOnline(true)
                .isVerified(true)
                .build();
    }

    @Nested
    @DisplayName("Get User By ID Tests")
    class GetUserByIdTests {

        @Test
        @DisplayName("Should return user when found by ID")
        void shouldReturnUserWhenFound() {
            // Given
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

            // When
            UserResponse response = userService.getUserById(testUserId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(testUserId);
            assertThat(response.getEmail()).isEqualTo("test@example.com");
            assertThat(response.getFirstName()).isEqualTo("John");
            assertThat(response.getLastName()).isEqualTo("Doe");

            verify(userRepository).findById(testUserId);
        }

        @Test
        @DisplayName("Should throw exception when user not found by ID")
        void shouldThrowExceptionWhenUserNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> userService.getUserById(unknownId))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("Utilisateur non trouvé");
        }
    }

    @Nested
    @DisplayName("Get Public User By ID Tests")
    class GetPublicUserByIdTests {

        @Test
        @DisplayName("Should return public user profile when found")
        void shouldReturnPublicUserProfile() {
            // Given
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

            // When
            PublicUserResponse response = userService.getPublicUserById(testUserId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(testUserId);
            assertThat(response.getFirstName()).isEqualTo("John");
            assertThat(response.getLastName()).isEqualTo("Doe");
            // Public profile should not expose email directly in most cases

            verify(userRepository).findById(testUserId);
        }
    }

    @Nested
    @DisplayName("Get User By Email Tests")
    class GetUserByEmailTests {

        @Test
        @DisplayName("Should return user when found by email")
        void shouldReturnUserWhenFoundByEmail() {
            // Given
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

            // When
            UserResponse response = userService.getUserByEmail("test@example.com");

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getEmail()).isEqualTo("test@example.com");

            verify(userRepository).findByEmail("test@example.com");
        }

        @Test
        @DisplayName("Should throw exception when user not found by email")
        void shouldThrowExceptionWhenUserNotFoundByEmail() {
            // Given
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> userService.getUserByEmail("unknown@example.com"))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("Utilisateur non trouvé");
        }
    }

    @Nested
    @DisplayName("Update User Tests")
    class UpdateUserTests {

        @Test
        @DisplayName("Should update user first name")
        void shouldUpdateUserFirstName() {
            // Given
            UpdateUserRequest request = new UpdateUserRequest();
            request.setFirstName("Jane");

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            UserResponse response = userService.updateUser(testUserId, request);

            // Then
            assertThat(response.getFirstName()).isEqualTo("Jane");
            verify(userRepository).save(argThat(user -> user.getFirstName().equals("Jane")));
        }

        @Test
        @DisplayName("Should update user last name")
        void shouldUpdateUserLastName() {
            // Given
            UpdateUserRequest request = new UpdateUserRequest();
            request.setLastName("Smith");

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            UserResponse response = userService.updateUser(testUserId, request);

            // Then
            assertThat(response.getLastName()).isEqualTo("Smith");
        }

        @Test
        @DisplayName("Should update user bio")
        void shouldUpdateUserBio() {
            // Given
            UpdateUserRequest request = new UpdateUserRequest();
            request.setBio("New bio content");

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            UserResponse response = userService.updateUser(testUserId, request);

            // Then
            assertThat(response.getBio()).isEqualTo("New bio content");
        }

        @Test
        @DisplayName("Should update user sports")
        void shouldUpdateUserSports() {
            // Given
            UpdateUserRequest request = new UpdateUserRequest();
            request.setSports(new HashSet<>(Set.of("Tennis", "Basketball")));

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            UserResponse response = userService.updateUser(testUserId, request);

            // Then
            assertThat(response.getSports()).containsExactlyInAnyOrder("Tennis", "Basketball");
        }

        @Test
        @DisplayName("Should update multiple fields at once")
        void shouldUpdateMultipleFields() {
            // Given
            UpdateUserRequest request = new UpdateUserRequest();
            request.setFirstName("Jane");
            request.setLastName("Smith");
            request.setBio("Updated bio");
            request.setProfilePicture("http://example.com/new-picture.jpg");

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            UserResponse response = userService.updateUser(testUserId, request);

            // Then
            assertThat(response.getFirstName()).isEqualTo("Jane");
            assertThat(response.getLastName()).isEqualTo("Smith");
            assertThat(response.getBio()).isEqualTo("Updated bio");
            assertThat(response.getProfilePicture()).isEqualTo("http://example.com/new-picture.jpg");
        }

        @Test
        @DisplayName("Should not update fields that are null in request")
        void shouldNotUpdateNullFields() {
            // Given
            UpdateUserRequest request = new UpdateUserRequest();
            // All fields are null

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            UserResponse response = userService.updateUser(testUserId, request);

            // Then
            assertThat(response.getFirstName()).isEqualTo("John");
            assertThat(response.getLastName()).isEqualTo("Doe");
            assertThat(response.getBio()).isEqualTo("Test bio");
        }

        @Test
        @DisplayName("Should throw exception when user not found during update")
        void shouldThrowExceptionWhenUserNotFoundDuringUpdate() {
            // Given
            UUID unknownId = UUID.randomUUID();
            UpdateUserRequest request = new UpdateUserRequest();
            request.setFirstName("Jane");

            when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> userService.updateUser(unknownId, request))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("Utilisateur non trouvé");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("Search Users Tests")
    class SearchUsersTests {

        @Test
        @DisplayName("Should return matching users when searching")
        void shouldReturnMatchingUsers() {
            // Given
            User user1 = User.builder().id(UUID.randomUUID()).firstName("John").lastName("Doe").email("john@test.com").password("pass").build();
            User user2 = User.builder().id(UUID.randomUUID()).firstName("Johnny").lastName("Smith").email("johnny@test.com").password("pass").build();

            when(userRepository.searchUsers("John")).thenReturn(List.of(user1, user2));

            // When
            List<PublicUserResponse> results = userService.searchUsers("John");

            // Then
            assertThat(results).hasSize(2);
            verify(userRepository).searchUsers("John");
        }

        @Test
        @DisplayName("Should return empty list when no users match search")
        void shouldReturnEmptyListWhenNoUsersMatch() {
            // Given
            when(userRepository.searchUsers("NonexistentUser")).thenReturn(Collections.emptyList());

            // When
            List<PublicUserResponse> results = userService.searchUsers("NonexistentUser");

            // Then
            assertThat(results).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Discover Users Tests")
    class GetDiscoverUsersTests {

        @Test
        @DisplayName("Should return non-friend users for discovery")
        void shouldReturnNonFriendUsers() {
            // Given
            User user1 = User.builder().id(UUID.randomUUID()).firstName("Jane").lastName("Doe").email("jane@test.com").password("pass").build();
            User user2 = User.builder().id(UUID.randomUUID()).firstName("Bob").lastName("Smith").email("bob@test.com").password("pass").build();

            when(userRepository.findNonFriendUsers(testUserId)).thenReturn(List.of(user1, user2));

            // When
            List<PublicUserResponse> results = userService.getDiscoverUsers(testUserId);

            // Then
            assertThat(results).hasSize(2);
            verify(userRepository).findNonFriendUsers(testUserId);
        }
    }

    @Nested
    @DisplayName("Set User Online Status Tests")
    class SetUserOnlineStatusTests {

        @Test
        @DisplayName("Should set user online")
        void shouldSetUserOnline() {
            // Given
            testUser.setIsOnline(false);
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            userService.setUserOnlineStatus(testUserId, true);

            // Then
            verify(userRepository).save(argThat(user -> user.getIsOnline()));
        }

        @Test
        @DisplayName("Should set user offline and update lastSeen")
        void shouldSetUserOfflineAndUpdateLastSeen() {
            // Given
            testUser.setIsOnline(true);
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            userService.setUserOnlineStatus(testUserId, false);

            // Then
            verify(userRepository).save(argThat(user ->
                    !user.getIsOnline() && user.getLastSeen() != null
            ));
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFoundForStatusUpdate() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> userService.setUserOnlineStatus(unknownId, true))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("Utilisateur non trouvé");
        }
    }

    @Nested
    @DisplayName("Find User Methods Tests")
    class FindUserMethodsTests {

        @Test
        @DisplayName("Should find user by ID and return entity")
        void shouldFindUserById() {
            // Given
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

            // When
            User result = userService.findById(testUserId);

            // Then
            assertThat(result).isEqualTo(testUser);
        }

        @Test
        @DisplayName("Should find user by email and return entity")
        void shouldFindUserByEmail() {
            // Given
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

            // When
            User result = userService.findByEmail("test@example.com");

            // Then
            assertThat(result).isEqualTo(testUser);
        }
    }
}

package com.teemup.service;

import com.teemup.dto.user.PublicUserResponse;
import com.teemup.dto.user.UpdateUserRequest;
import com.teemup.dto.user.UserResponse;
import com.teemup.entity.User;
import com.teemup.exception.UserNotFoundException;
import com.teemup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur non trouvé"));
        return UserResponse.fromEntity(user);
    }

    /**
     * Get public profile of a user (for viewing other users).
     * Excludes sensitive data like email, exact age, last seen.
     */
    public PublicUserResponse getPublicUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur non trouvé"));
        return PublicUserResponse.fromEntity(user);
    }

    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur non trouvé"));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateUser(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur non trouvé"));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getProfilePicture() != null) {
            user.setProfilePicture(request.getProfilePicture());
        }
        if (request.getCoverImage() != null) {
            user.setCoverImage(request.getCoverImage());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getSports() != null) {
            user.setSports(request.getSports());
        }
        if (request.getOnboardingCompleted() != null) {
            user.setOnboardingCompleted(request.getOnboardingCompleted());
        }
        if (request.getLatitude() != null) {
            user.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            user.setLongitude(request.getLongitude());
        }
        // Note: isPro is set via subscription flow, not direct update
        // Removing ability for users to self-elevate to Pro status

        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    public List<PublicUserResponse> searchUsers(String query) {
        return userRepository.searchUsers(query).stream()
                .map(PublicUserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PublicUserResponse> getDiscoverUsers(UUID currentUserId) {
        return userRepository.findNonFriendUsers(currentUserId).stream()
                .map(PublicUserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PublicUserResponse> getUserFriends(UUID userId) {
        return userRepository.findFriendsByUserId(userId).stream()
                .map(PublicUserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void setUserOnlineStatus(UUID userId, boolean isOnline) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur non trouvé"));

        user.setIsOnline(isOnline);
        if (!isOnline) {
            user.setLastSeen(LocalDateTime.now());
        }
        userRepository.save(user);
    }

    public User findById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur non trouvé"));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Utilisateur non trouvé"));
    }
}

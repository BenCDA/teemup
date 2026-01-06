package com.teemup.dto.user;

import com.teemup.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private String profilePicture;
    private String coverImage;
    private String bio;
    private Set<String> sports;
    private Boolean isOnline;
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt;

    // Verification fields
    private Boolean isVerified;
    private Integer verifiedAge;
    private String verifiedGender;

    // Onboarding
    private Boolean onboardingCompleted;

    // Location
    private Double latitude;
    private Double longitude;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .coverImage(user.getCoverImage())
                .bio(user.getBio())
                .sports(user.getSports())
                .isOnline(user.getIsOnline())
                .lastSeen(user.getLastSeen())
                .createdAt(user.getCreatedAt())
                .isVerified(user.getIsVerified())
                .verifiedAge(user.getVerifiedAge())
                .verifiedGender(user.getVerifiedGender() != null ? user.getVerifiedGender().name() : null)
                .onboardingCompleted(user.getOnboardingCompleted())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .build();
    }
}

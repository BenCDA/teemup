package com.teemup.dto.user;

import com.teemup.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

/**
 * Public user profile DTO - excludes sensitive information like email, exact age, lastSeen.
 * Used when viewing other users' profiles.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicUserResponse {

    private UUID id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String profilePicture;
    private String coverImage;
    private String bio;
    private Set<String> sports;
    private Boolean isOnline;
    private Boolean isVerified;
    // Only expose age range, not exact age (privacy)
    private String ageRange;

    public static PublicUserResponse fromEntity(User user) {
        String ageRange = null;
        if (user.getVerifiedAge() != null) {
            int age = user.getVerifiedAge();
            if (age < 20) ageRange = "18-19";
            else if (age < 25) ageRange = "20-24";
            else if (age < 30) ageRange = "25-29";
            else if (age < 35) ageRange = "30-34";
            else if (age < 40) ageRange = "35-39";
            else if (age < 50) ageRange = "40-49";
            else ageRange = "50+";
        }

        return PublicUserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .coverImage(user.getCoverImage())
                .bio(user.getBio())
                .sports(user.getSports())
                .isOnline(user.getIsOnline())
                .isVerified(user.getIsVerified())
                .ageRange(ageRange)
                .build();
    }
}

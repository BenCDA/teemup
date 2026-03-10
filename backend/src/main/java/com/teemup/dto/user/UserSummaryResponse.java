package com.teemup.dto.user;

import com.teemup.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Minimal user payload for cross-user contexts (messaging, notifications, friend requests).
 * Avoids exposing sensitive fields such as email, exact age, verified gender, location and last seen.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {

    private UUID id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String profilePicture;
    private Boolean isOnline;
    private Boolean isVerified;
    private String ageRange;
    private Boolean isPro;

    public static UserSummaryResponse fromEntity(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .isOnline(user.getIsOnline())
                .isVerified(user.getIsVerified())
                .ageRange(toAgeRange(user.getVerifiedAge()))
                .isPro(user.getIsPro())
                .build();
    }

    private static String toAgeRange(Integer age) {
        if (age == null) {
            return null;
        }
        if (age < 20) return "18-19";
        if (age < 25) return "20-24";
        if (age < 30) return "25-29";
        if (age < 35) return "30-34";
        if (age < 40) return "35-39";
        if (age < 50) return "40-49";
        return "50+";
    }
}

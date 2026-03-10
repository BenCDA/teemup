package com.teemup.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column
    private String profilePicture;

    @Column
    private String coverImage;

    @Column
    private String bio;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_sports", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "sport")
    private Set<String> sports = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column
    private String providerId;

    @Column
    private String refreshToken;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isOnline = false;

    @Column
    private LocalDateTime lastSeen;

    // Face verification fields
    @Column(nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column
    private Integer verifiedAge;

    @Enumerated(EnumType.STRING)
    private VerifiedGender verifiedGender;

    @Column
    private Double verificationConfidence;

    @Column
    private LocalDateTime verifiedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean onboardingCompleted = false;

    // Pro user status (can create paid events)
    @Column(nullable = false)
    @Builder.Default
    private Boolean isPro = false;

    // User location for distance-based search
    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @ManyToMany
    @JoinTable(
        name = "user_friends",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "friend_id")
    )
    @Builder.Default
    private Set<User> friends = new HashSet<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum AuthProvider {
        LOCAL, GOOGLE, FACEBOOK
    }

    public enum VerifiedGender {
        MALE, FEMALE
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return id != null && id.equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

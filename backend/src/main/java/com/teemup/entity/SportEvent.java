package com.teemup.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "sport_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String sport;

    @Column
    private String title;

    @Column
    private String description;

    // Location fields
    @Column
    private String location;  // Address string

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RecurrenceType recurrence = RecurrenceType.NONE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublic = true;

    // Paid event fields (only for Pro users)
    @Column(nullable = false)
    @Builder.Default
    private Boolean isPaid = false;

    @Column
    private Double price;  // Price in euros

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<EventParticipant> participants = new HashSet<>();

    // Maximum number of participants (null = unlimited)
    @Column
    private Integer maxParticipants;

    public enum RecurrenceType {
        NONE,           // One-time event
        DAILY,          // Every day
        WEEKLY,         // Every week on same day
        BIWEEKLY,       // Every two weeks
        MONTHLY         // Every month on same date
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SportEvent other)) return false;
        return id != null && id.equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

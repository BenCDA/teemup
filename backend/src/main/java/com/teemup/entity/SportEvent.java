package com.teemup.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
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
    private List<EventParticipant> participants = new ArrayList<>();

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
}

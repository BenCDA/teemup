package com.teemup.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MessageType type = MessageType.TEXT;

    @ElementCollection
    @CollectionTable(name = "message_read_by", joinColumns = @JoinColumn(name = "message_id"))
    @Column(name = "user_id")
    @Builder.Default
    private Set<UUID> readBy = new HashSet<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean isEdited = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum MessageType {
        TEXT, IMAGE, FILE, SYSTEM
    }

    public void markAsRead(UUID userId) {
        readBy.add(userId);
    }

    public boolean isReadBy(UUID userId) {
        return readBy.contains(userId);
    }
}

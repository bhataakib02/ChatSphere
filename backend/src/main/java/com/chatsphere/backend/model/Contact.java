package com.chatsphere.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contacts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_low_id", "user_high_id"}))
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_low_id")
    private User userLow;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_high_id")
    private User userHigh;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Contact() {}

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static long[] orderedIds(long a, long b) {
        return a < b ? new long[]{a, b} : new long[]{b, a};
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUserLow() { return userLow; }
    public void setUserLow(User userLow) { this.userLow = userLow; }
    public User getUserHigh() { return userHigh; }
    public void setUserHigh(User userHigh) { this.userHigh = userHigh; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

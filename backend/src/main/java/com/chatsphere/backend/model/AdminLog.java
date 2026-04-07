package com.chatsphere.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_logs")
public class AdminLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private User admin;

    private String action; // e.g., "BAN_USER", "DELETE_GROUP", "CHANGE_ROLE"
    
    @Column(columnDefinition = "TEXT")
    private String details;

    private String targetId;
    private LocalDateTime createdAt = LocalDateTime.now();

    public AdminLog() {}

    public AdminLog(User admin, String action, String details, String targetId) {
        this.admin = admin;
        this.action = action;
        this.details = details;
        this.targetId = targetId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getAdmin() { return admin; }
    public void setAdmin(User admin) { this.admin = admin; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

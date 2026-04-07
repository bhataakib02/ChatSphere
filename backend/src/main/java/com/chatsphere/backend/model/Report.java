package com.chatsphere.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_message_id")
    private Message reportedMessage;

    private String reason;
    
    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    @Enumerated(EnumType.STRING)
    private EReportStatus status = EReportStatus.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum EReportStatus {
        PENDING, RESOLVED, IGNORED
    }

    public Report() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }
    public User getReportedUser() { return reportedUser; }
    public void setReportedUser(User reportedUser) { this.reportedUser = reportedUser; }
    public Message getReportedMessage() { return reportedMessage; }
    public void setReportedMessage(Message reportedMessage) { this.reportedMessage = reportedMessage; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    public EReportStatus getStatus() { return status; }
    public void setStatus(EReportStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

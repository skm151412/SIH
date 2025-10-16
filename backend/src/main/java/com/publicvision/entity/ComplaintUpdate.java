package com.publicvision.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "complaint_updates")
public class ComplaintUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long updateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id", nullable = false)
    private User updatedBy;

    @Enumerated(EnumType.STRING)
    private Complaint.ComplaintStatus status;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ComplaintUpdate() {
    }

    public ComplaintUpdate(Long updateId, Complaint complaint, User updatedBy, Complaint.ComplaintStatus status, String comment, LocalDateTime createdAt) {
        this.updateId = updateId;
        this.complaint = complaint;
        this.updatedBy = updatedBy;
        this.status = status;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public Long getUpdateId() {
        return updateId;
    }

    public void setUpdateId(Long updateId) {
        this.updateId = updateId;
    }

    public Complaint getComplaint() {
        return complaint;
    }

    public void setComplaint(Complaint complaint) {
        this.complaint = complaint;
    }

    public User getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(User updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Complaint.ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(Complaint.ComplaintStatus status) {
        this.status = status;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

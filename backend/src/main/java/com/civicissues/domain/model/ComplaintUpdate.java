package com.civicissues.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_updates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ComplaintUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = true)
    private String oldStatus;

    @Column(nullable = true)
    private String newStatus;

    @Column(nullable = true)
    private String oldPriority;

    @Column(nullable = true)
    private String newPriority;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "old_assigned_to_id")
    private User oldAssignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "new_assigned_to_id")
    private User newAssignedTo;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @CreatedBy
    @Column(nullable = false, updatable = false)
    private String createdBy;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UpdateType updateType;

    public enum UpdateType {
        STATUS_CHANGE,
        PRIORITY_CHANGE,
        ASSIGNMENT_CHANGE,
        GENERAL_UPDATE,
        RESOLUTION
    }
}

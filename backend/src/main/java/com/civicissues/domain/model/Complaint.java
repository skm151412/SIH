package com.civicissues.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "complaints")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Category category;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Priority priority;

    @Column(nullable = true)
    private String location;

    @Column(nullable = true)
    private Double latitude;

    @Column(nullable = true)
    private Double longitude;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(nullable = false, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(nullable = false)
    private String lastModifiedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Builder.Default
    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComplaintUpdate> updates = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ComplaintMedia> media = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ComplaintVote> votes = new HashSet<>();

    @Column(nullable = false)
    @Builder.Default
    private Integer upvotes = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer downvotes = 0;

    @Column(nullable = true)
    private LocalDateTime resolvedAt;

    @Column(nullable = true, length = 1000)
    private String resolutionDetails;

    // Enumerations for complaint properties
    public enum Status {
        PENDING,
        UNDER_REVIEW,
        IN_PROGRESS,
        RESOLVED,
        REJECTED,
        DUPLICATE
    }

    public enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum Category {
        ROADS_AND_INFRASTRUCTURE,
        PUBLIC_TRANSPORTATION,
        WATER_SUPPLY,
        ELECTRICITY,
        WASTE_MANAGEMENT,
        PUBLIC_SAFETY,
        NOISE_POLLUTION,
        ENVIRONMENTAL_HAZARD,
        PARKS_AND_RECREATION,
        STREET_LIGHTING,
        DRAINAGE_ISSUES,
        ILLEGAL_CONSTRUCTION,
        VANDALISM,
        STRAY_ANIMALS,
        OTHER
    }

    // Helper methods
    public void addComment(Comment comment) {
        comments.add(comment);
        comment.setComplaint(this);
    }

    public void removeComment(Comment comment) {
        comments.remove(comment);
        comment.setComplaint(null);
    }

    public void addUpdate(ComplaintUpdate update) {
        updates.add(update);
        update.setComplaint(this);
    }

    public void addMedia(ComplaintMedia media) {
        this.media.add(media);
        media.setComplaint(this);
    }

    public void removeMedia(ComplaintMedia media) {
        this.media.remove(media);
        media.setComplaint(null);
    }
}

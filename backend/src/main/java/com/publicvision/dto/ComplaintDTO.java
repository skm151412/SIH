package com.publicvision.dto;

import java.time.LocalDateTime;

import com.publicvision.entity.Complaint;

public class ComplaintDTO {

    private Long complaintId;
    private Long userId;
    private String userFullName;
    private String title;
    private String description;
    private String category;
    private String photoPath;
    private Double locationLat;
    private Double locationLng;
    private String address;
    private Complaint.ComplaintStatus status;
    private Long assignedToId;
    private String assignedToName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isDuplicate;
    private Long originalComplaintId;
    private Integer rating;
    private String feedback;
    private Boolean reopened;
    private String reopenReason;

    public ComplaintDTO() {
    }

    public static ComplaintDTO from(Complaint complaint) {
        ComplaintDTO dto = new ComplaintDTO();
        dto.setComplaintId(complaint.getComplaintId());
        dto.setUserId(complaint.getUser().getUserId());
        dto.setUserFullName(complaint.getUser().getName());
        dto.setTitle(complaint.getTitle());
        dto.setDescription(complaint.getDescription());
        dto.setCategory(complaint.getCategory());
        dto.setPhotoPath(complaint.getPhotoPath());
        dto.setLocationLat(complaint.getLocationLat());
        dto.setLocationLng(complaint.getLocationLng());
        dto.setAddress(complaint.getAddress());
        dto.setStatus(complaint.getStatus());
        dto.setCreatedAt(complaint.getCreatedAt());
        dto.setUpdatedAt(complaint.getUpdatedAt());
        dto.setIsDuplicate(complaint.getIsDuplicate());

        if (complaint.getOriginalComplaint() != null) {
            dto.setOriginalComplaintId(complaint.getOriginalComplaint().getComplaintId());
        }

        if (complaint.getAssignedTo() != null) {
            dto.setAssignedToId(complaint.getAssignedTo().getUserId());
            dto.setAssignedToName(complaint.getAssignedTo().getName());
        }

        dto.setRating(complaint.getRating());
        dto.setFeedback(complaint.getFeedback());
        dto.setReopened(complaint.getReopened());
        dto.setReopenReason(complaint.getReopenReason());

        return dto;
    }

    // Getters and setters
    public Long getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(Long complaintId) {
        this.complaintId = complaintId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = userFullName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPhotoPath() {
        return photoPath;
    }

    public void setPhotoPath(String photoPath) {
        this.photoPath = photoPath;
    }

    public Double getLocationLat() {
        return locationLat;
    }

    public void setLocationLat(Double locationLat) {
        this.locationLat = locationLat;
    }

    public Double getLocationLng() {
        return locationLng;
    }

    public void setLocationLng(Double locationLng) {
        this.locationLng = locationLng;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Complaint.ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(Complaint.ComplaintStatus status) {
        this.status = status;
    }

    public Long getAssignedToId() {
        return assignedToId;
    }

    public void setAssignedToId(Long assignedToId) {
        this.assignedToId = assignedToId;
    }

    public String getAssignedToName() {
        return assignedToName;
    }

    public void setAssignedToName(String assignedToName) {
        this.assignedToName = assignedToName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getIsDuplicate() {
        return isDuplicate;
    }

    public void setIsDuplicate(Boolean isDuplicate) {
        this.isDuplicate = isDuplicate;
    }

    public Long getOriginalComplaintId() {
        return originalComplaintId;
    }

    public void setOriginalComplaintId(Long originalComplaintId) {
        this.originalComplaintId = originalComplaintId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public Boolean getReopened() {
        return reopened;
    }

    public void setReopened(Boolean reopened) {
        this.reopened = reopened;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
    }
}

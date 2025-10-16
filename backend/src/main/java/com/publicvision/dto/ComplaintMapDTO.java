package com.publicvision.dto;

import com.publicvision.entity.Complaint;

import java.time.LocalDateTime;

public class ComplaintMapDTO {

    private Long id;
    private Double latitude;
    private Double longitude;
    private String category;
    private String status;
    private String title;
    private LocalDateTime createdAt;

    public ComplaintMapDTO() {
    }

    public ComplaintMapDTO(Long id, Double latitude, Double longitude, String category, String status, String title, LocalDateTime createdAt) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.category = category;
        this.status = status;
        this.title = title;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static ComplaintMapDTO fromComplaint(Complaint complaint) {
        ComplaintMapDTO dto = new ComplaintMapDTO();
        dto.setId(complaint.getComplaintId());
        dto.setLatitude(complaint.getLocationLat());
        dto.setLongitude(complaint.getLocationLng());
        dto.setCategory(complaint.getCategory());
        dto.setStatus(complaint.getStatus().name());
        dto.setTitle(complaint.getTitle());
        dto.setCreatedAt(complaint.getCreatedAt());
        return dto;
    }
}

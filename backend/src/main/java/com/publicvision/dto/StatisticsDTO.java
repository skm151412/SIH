package com.publicvision.dto;

import java.util.List;
import java.util.Map;

public class StatisticsDTO {

    // Basic aggregates
    private Long totalComplaints;
    private Long pendingComplaints;
    private Long inProgressComplaints;
    private Long resolvedComplaints;
    private Long rejectedComplaints;

    // Distribution maps
    private Map<String, Long> complaintsByCategory;
    private Map<String, Long> complaintsByStatus;

    // Hotspot areas (rounded coordinate buckets)
    private List<TopAreaDTO> topAreas;

    public static class TopAreaDTO {

        private Double lat;
        private Double lng;
        private Long count;

        public TopAreaDTO() {
        }

        public TopAreaDTO(Double lat, Double lng, Long count) {
            this.lat = lat;
            this.lng = lng;
            this.count = count;
        }

        public Double getLat() {
            return lat;
        }

        public void setLat(Double lat) {
            this.lat = lat;
        }

        public Double getLng() {
            return lng;
        }

        public void setLng(Double lng) {
            this.lng = lng;
        }

        public Long getCount() {
            return count;
        }

        public void setCount(Long count) {
            this.count = count;
        }
    }

    public StatisticsDTO() {
    }

    public StatisticsDTO(Long totalComplaints, Long pendingComplaints, Long inProgressComplaints, Long resolvedComplaints, Long rejectedComplaints, Map<String, Long> complaintsByCategory, Map<String, Long> complaintsByStatus, List<TopAreaDTO> topAreas) {
        this.totalComplaints = totalComplaints;
        this.pendingComplaints = pendingComplaints;
        this.inProgressComplaints = inProgressComplaints;
        this.resolvedComplaints = resolvedComplaints;
        this.rejectedComplaints = rejectedComplaints;
        this.complaintsByCategory = complaintsByCategory;
        this.complaintsByStatus = complaintsByStatus;
        this.topAreas = topAreas;
    }

    public Long getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(Long totalComplaints) {
        this.totalComplaints = totalComplaints;
    }

    public Long getPendingComplaints() {
        return pendingComplaints;
    }

    public void setPendingComplaints(Long pendingComplaints) {
        this.pendingComplaints = pendingComplaints;
    }

    public Long getInProgressComplaints() {
        return inProgressComplaints;
    }

    public void setInProgressComplaints(Long inProgressComplaints) {
        this.inProgressComplaints = inProgressComplaints;
    }

    public Long getResolvedComplaints() {
        return resolvedComplaints;
    }

    public void setResolvedComplaints(Long resolvedComplaints) {
        this.resolvedComplaints = resolvedComplaints;
    }

    public Long getRejectedComplaints() {
        return rejectedComplaints;
    }

    public void setRejectedComplaints(Long rejectedComplaints) {
        this.rejectedComplaints = rejectedComplaints;
    }

    public Map<String, Long> getComplaintsByCategory() {
        return complaintsByCategory;
    }

    public void setComplaintsByCategory(Map<String, Long> complaintsByCategory) {
        this.complaintsByCategory = complaintsByCategory;
    }

    public Map<String, Long> getComplaintsByStatus() {
        return complaintsByStatus;
    }

    public void setComplaintsByStatus(Map<String, Long> complaintsByStatus) {
        this.complaintsByStatus = complaintsByStatus;
    }

    public List<TopAreaDTO> getTopAreas() {
        return topAreas;
    }

    public void setTopAreas(List<TopAreaDTO> topAreas) {
        this.topAreas = topAreas;
    }
}

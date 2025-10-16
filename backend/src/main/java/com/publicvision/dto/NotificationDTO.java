package com.publicvision.dto;

import java.time.LocalDateTime;

import com.publicvision.entity.Notification;

public class NotificationDTO {

    private Long id;
    private Long userId;
    private Long complaintId;
    private String complaintTitle;
    private String message;
    private LocalDateTime sentAt;
    private Boolean isRead;
    private String type;

    public NotificationDTO() {
    }

    public NotificationDTO(Long id, Long userId, Long complaintId, String complaintTitle, String message, LocalDateTime sentAt, Boolean isRead, String type) {
        this.id = id;
        this.userId = userId;
        this.complaintId = complaintId;
        this.complaintTitle = complaintTitle;
        this.message = message;
        this.sentAt = sentAt;
        this.isRead = isRead;
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(Long complaintId) {
        this.complaintId = complaintId;
    }

    public String getComplaintTitle() {
        return complaintTitle;
    }

    public void setComplaintTitle(String complaintTitle) {
        this.complaintTitle = complaintTitle;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public static NotificationDTO fromNotification(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getNotificationId());
        dto.setUserId(notification.getUser().getUserId());

        if (notification.getComplaint() != null) {
            dto.setComplaintId(notification.getComplaint().getComplaintId());
            dto.setComplaintTitle(notification.getComplaint().getTitle());
        }

        dto.setMessage(notification.getMessage());
        dto.setSentAt(notification.getSentAt());
        dto.setIsRead(notification.getIsRead());
        dto.setType(notification.getType().name());

        return dto;
    }
}

package com.publicvision.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.publicvision.dto.NotificationDTO;
import com.publicvision.entity.Complaint;
import com.publicvision.entity.Notification;
import com.publicvision.entity.Notification.NotificationType;
import com.publicvision.entity.User;
import com.publicvision.repository.NotificationRepository;
import com.publicvision.repository.UserRepository;

import java.io.IOException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // Store active SSE connections by user ID
    private final Map<Long, SseEmitter> userEmitters = new ConcurrentHashMap<>();

    /**
     * Gets paginated notifications for the current user
     */
    public Page<NotificationDTO> getUserNotifications(int page, int size) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("sentAt").descending());
        Page<Notification> notificationPage = notificationRepository.findByUser(user, pageable);

        return notificationPage.map(NotificationDTO::fromNotification);
    }

    /**
     * Get count of unread notifications for current user
     */
    public Long getUnreadNotificationCount() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    /**
     * Mark a notification as read
     */
    @Transactional
    public void markAsRead(Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Notification does not belong to the current user");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Mark all notifications as read for current user
     */
    @Transactional
    public void markAllAsRead() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> unreadNotifications = notificationRepository.findByUserAndIsReadFalse(user);
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    /**
     * Creates a notification and sends it via SSE if user is connected
     */
    @Transactional
    public Notification createNotification(User user, String message, NotificationType type, Complaint complaint) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setType(type);
        notification.setComplaint(complaint);
        notification.setSentAt(LocalDateTime.now());
        notification.setIsRead(false);

        Notification savedNotification = notificationRepository.save(notification);

        // Send notification through SSE if user is connected
        sendNotificationToUser(user.getUserId(), NotificationDTO.fromNotification(savedNotification));

        return savedNotification;
    }

    /**
     * Register a new SSE connection for a user
     */
    public SseEmitter createSseEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // Long timeout

        // Set completion callbacks
        emitter.onCompletion(() -> userEmitters.remove(userId));
        emitter.onTimeout(() -> userEmitters.remove(userId));
        emitter.onError(e -> userEmitters.remove(userId));

        // Send initial connection established event
        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connection established"));
        } catch (IOException e) {
            emitter.completeWithError(e);
            return emitter;
        }

        // Store emitter in the map
        userEmitters.put(userId, emitter);

        return emitter;
    }

    /**
     * Send notification to a specific user via SSE
     */
    private void sendNotificationToUser(Long userId, NotificationDTO notification) {
        SseEmitter emitter = userEmitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(notification));
            } catch (IOException e) {
                userEmitters.remove(userId);
            }
        }
    }

    /**
     * Send status change notification to all involved users
     */
    public void sendStatusChangeNotification(Complaint complaint, String oldStatus, String newStatus) {
        // Notify the complaint creator
        String message = String.format("Your complaint '%s' status changed from %s to %s",
                complaint.getTitle(), oldStatus, newStatus);
        createNotification(complaint.getUser(), message, NotificationType.STATUS_CHANGE, complaint);

        // Notify assigned staff if any
        if (complaint.getAssignedTo() != null && !complaint.getAssignedTo().equals(complaint.getUser())) {
            String staffMessage = String.format("Complaint '%s' status updated to %s",
                    complaint.getTitle(), newStatus);
            createNotification(complaint.getAssignedTo(), staffMessage, NotificationType.STATUS_CHANGE, complaint);
        }
    }

    /**
     * Send comment notification to all involved users
     */
    public void sendCommentNotification(Complaint complaint, User commenter, String commentText) {
        // Don't notify the commenter about their own comment
        if (!complaint.getUser().getUserId().equals(commenter.getUserId())) {
            String message = String.format("%s commented on your complaint '%s': \"%s\"",
                    commenter.getName(), complaint.getTitle(),
                    commentText.length() > 30 ? commentText.substring(0, 27) + "..." : commentText);
            createNotification(complaint.getUser(), message, NotificationType.COMMENT, complaint);
        }
    }

    /**
     * Send comment notification to assigned staff
     */
    public void sendStaffCommentNotification(Complaint complaint, User commenter, String commentText) {
        // Notify assigned staff if any and not the commenter
        if (complaint.getAssignedTo() != null
                && !complaint.getAssignedTo().getUserId().equals(commenter.getUserId())) {
            String staffMessage = String.format("New comment on complaint '%s' by %s: \"%s\"",
                    complaint.getTitle(), commenter.getName(),
                    commentText.length() > 30 ? commentText.substring(0, 27) + "..." : commentText);
            createNotification(complaint.getAssignedTo(), staffMessage, NotificationType.COMMENT, complaint);
        }
    }
}

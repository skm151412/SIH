package com.publicvision.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.publicvision.dto.DuplicateComplaintDTO;
import com.publicvision.entity.Complaint;
import com.publicvision.entity.Notification;
import com.publicvision.entity.Notification.NotificationType;
import com.publicvision.entity.User;
import com.publicvision.repository.ComplaintRepository;
import com.publicvision.repository.UserRepository;
import com.publicvision.util.GeoUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for handling duplicate complaint detection and management
 */
@Service
public class DuplicateComplaintService {

    private static final Logger logger = LoggerFactory.getLogger(DuplicateComplaintService.class);

    // Default distance threshold: 200 meters
    @Value("${app.duplicate-detection.distance-threshold-km:0.2}")
    private double distanceThresholdKm;

    // Default time threshold: 48 hours
    @Value("${app.duplicate-detection.hours-threshold:48}")
    private int hoursThreshold;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Check if a complaint is a duplicate based on: - Same category - Location
     * within specified distance threshold - Created within specified time
     * threshold
     *
     * @param complaint The complaint to check
     * @return The original complaint if found, null otherwise
     */
    public Complaint checkForDuplicate(Complaint complaint) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusHours(hoursThreshold);

        List<Complaint> potentialDuplicates = complaintRepository.findPotentialDuplicates(
                complaint.getCategory(),
                complaint.getLocationLat(),
                complaint.getLocationLng(),
                distanceThresholdKm,
                cutoffDate);

        if (potentialDuplicates.isEmpty()) {
            logger.debug("No potential duplicates found for complaint");
            return null;
        }

        logger.info("Found {} potential duplicate(s) for new complaint", potentialDuplicates.size());

        // Return the most recent potential duplicate as the original
        return potentialDuplicates.get(0);
    }

    /**
     * Mark a complaint as a duplicate of another complaint
     *
     * @param complaint The complaint to mark as duplicate
     * @param originalComplaint The original complaint
     * @return The updated complaint
     */
    @Transactional
    public Complaint markAsDuplicate(Complaint complaint, Complaint originalComplaint) {
        complaint.setIsDuplicate(true);
        complaint.setOriginalComplaint(originalComplaint);

        // Save the updated complaint
        Complaint savedComplaint = complaintRepository.save(complaint);

        // Notify the user about the duplicate
        String message = String.format(
                "Your complaint '%s' has been marked as a duplicate of an existing complaint.",
                complaint.getTitle());

        notificationService.createNotification(
                complaint.getUser(),
                message,
                NotificationType.STATUS_CHANGE,
                complaint);

        // Notify admins about the duplicate
        List<User> adminUsers = userRepository.findByRole("ADMIN");
        String adminMessage = String.format(
                "New duplicate complaint detected: '%s' (ID: %d) is a duplicate of '%s' (ID: %d)",
                complaint.getTitle(),
                complaint.getComplaintId(),
                originalComplaint.getTitle(),
                originalComplaint.getComplaintId());

        for (User admin : adminUsers) {
            notificationService.createNotification(
                    admin,
                    adminMessage,
                    NotificationType.INFO,
                    complaint);
        }

        return savedComplaint;
    }

    /**
     * Get all duplicate complaints for a specific original complaint
     *
     * @param complaintId The ID of the original complaint
     * @return DuplicateComplaintDTO containing the original and its duplicates
     */
    @Transactional(readOnly = true)
    public DuplicateComplaintDTO getDuplicatesForComplaint(Long complaintId) {
        Complaint originalComplaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        List<Complaint> duplicates = complaintRepository.findByOriginalComplaintComplaintId(complaintId);

        return DuplicateComplaintDTO.fromComplaints(originalComplaint, duplicates);
    }

    /**
     * Merge duplicate complaints into the original complaint This
     * implementation keeps duplicates but could be extended to merge comments,
     * update counts, etc.
     *
     * @param originalComplaintId The ID of the original complaint
     * @param duplicateIds IDs of duplicates to merge
     * @return The updated DuplicateComplaintDTO
     */
    @Transactional
    public DuplicateComplaintDTO mergeComplaints(Long originalComplaintId, List<Long> duplicateIds) {
        Complaint originalComplaint = complaintRepository.findById(originalComplaintId)
                .orElseThrow(() -> new RuntimeException("Original complaint not found"));

        for (Long duplicateId : duplicateIds) {
            if (!duplicateId.equals(originalComplaintId)) {
                Complaint duplicateComplaint = complaintRepository.findById(duplicateId)
                        .orElseThrow(() -> new RuntimeException("Duplicate complaint not found: " + duplicateId));

                // Mark as duplicate if not already
                if (!duplicateComplaint.getIsDuplicate()
                        || duplicateComplaint.getOriginalComplaint() == null
                        || !duplicateComplaint.getOriginalComplaint().getComplaintId().equals(originalComplaintId)) {

                    duplicateComplaint.setIsDuplicate(true);
                    duplicateComplaint.setOriginalComplaint(originalComplaint);
                    complaintRepository.save(duplicateComplaint);

                    // Notify the user about their complaint being merged
                    String message = String.format(
                            "Your complaint '%s' has been merged with another complaint.",
                            duplicateComplaint.getTitle());

                    notificationService.createNotification(
                            duplicateComplaint.getUser(),
                            message,
                            NotificationType.STATUS_CHANGE,
                            duplicateComplaint);
                }
            }
        }

        // Return updated duplicates
        return getDuplicatesForComplaint(originalComplaintId);
    }
}

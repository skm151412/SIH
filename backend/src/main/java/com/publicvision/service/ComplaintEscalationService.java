package com.publicvision.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.publicvision.entity.Complaint;
import com.publicvision.entity.Complaint.ComplaintStatus;
import com.publicvision.entity.Notification.NotificationType;
import com.publicvision.entity.User;
import com.publicvision.repository.ComplaintRepository;
import com.publicvision.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ComplaintEscalationService {

    private static final Logger logger = LoggerFactory.getLogger(ComplaintEscalationService.class);

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Scheduled task that runs every hour to check for overdue complaints and
     * escalate them if needed
     */
    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 ms)
    @Transactional
    public void checkAndEscalateOverdueComplaints() {
        logger.info("Running scheduled task to check for overdue complaints");

        LocalDateTime now = LocalDateTime.now();
        List<Complaint> overdueComplaints = complaintRepository.findOverdueComplaints(now);

        logger.info("Found {} overdue complaints to escalate", overdueComplaints.size());

        if (overdueComplaints.isEmpty()) {
            return;
        }

        // Get admin users to notify
        List<User> adminUsers = userRepository.findByRole("ADMIN");

        for (Complaint complaint : overdueComplaints) {
            // Set escalated flag and status
            complaint.setEscalated(true);
            complaint.setStatus(ComplaintStatus.ESCALATED);
            complaint.setUpdatedAt(now);

            // Save changes
            complaintRepository.save(complaint);

            // Notify complaint owner
            String ownerMessage = String.format(
                    "Your complaint '%s' has been escalated due to exceeding SLA time limit.",
                    complaint.getTitle()
            );
            notificationService.createNotification(
                    complaint.getUser(),
                    ownerMessage,
                    NotificationType.STATUS_CHANGE,
                    complaint
            );

            // Notify assigned staff if any
            if (complaint.getAssignedTo() != null) {
                String staffMessage = String.format(
                        "Complaint '%s' has been automatically escalated due to exceeding SLA time limit.",
                        complaint.getTitle()
                );
                notificationService.createNotification(
                        complaint.getAssignedTo(),
                        staffMessage,
                        NotificationType.STATUS_CHANGE,
                        complaint
                );
            }

            // Notify all admins
            String adminMessage = String.format(
                    "ESCALATED: Complaint '%s' (ID: %d) has exceeded SLA time limit and requires attention.",
                    complaint.getTitle(),
                    complaint.getComplaintId()
            );

            for (User admin : adminUsers) {
                notificationService.createNotification(
                        admin,
                        adminMessage,
                        NotificationType.STATUS_CHANGE,
                        complaint
                );
            }
        }

        logger.info("Successfully escalated {} overdue complaints", overdueComplaints.size());
    }
}

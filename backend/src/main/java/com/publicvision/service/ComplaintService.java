package com.publicvision.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.publicvision.dto.ComplaintDTO;
import com.publicvision.dto.ComplaintRequest;
import com.publicvision.dto.ComplaintMapDTO;
import com.publicvision.dto.FeedbackRequest;
import com.publicvision.dto.StatisticsDTO;
import com.publicvision.dto.UpdateStatusRequest;
import com.publicvision.entity.Complaint;
import com.publicvision.entity.ComplaintUpdate;
import com.publicvision.entity.User;
import com.publicvision.repository.ComplaintRepository;
import com.publicvision.repository.ComplaintImageRepository;
import com.publicvision.entity.ComplaintImage;
import com.publicvision.repository.ComplaintUpdateRepository;
import com.publicvision.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private ComplaintUpdateRepository complaintUpdateRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ComplaintImageRepository complaintImageRepository;

    // Notifications currently not implemented
    @Transactional
    public ComplaintDTO createComplaint(ComplaintRequest complaintRequest, List<MultipartFile> images) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Complaint complaint = new Complaint();
        complaint.setTitle(complaintRequest.getTitle());
        complaint.setDescription(complaintRequest.getDescription());
        complaint.setCategory(complaintRequest.getCategory());
        complaint.setLocationLat(complaintRequest.getLocationLat());
        complaint.setLocationLng(complaintRequest.getLocationLng());
        complaint.setAddress(complaintRequest.getAddress());
        complaint.setUser(user);
        // Rely on entity defaults for status, timestamps, dueDate, flags
        Complaint saved = complaintRepository.save(complaint);

        // Persist images if provided
        if (images != null && !images.isEmpty()) {
            for (MultipartFile mf : images) {
                if (mf.isEmpty()) {
                    continue;
                }
                try {
                    ComplaintImage ci = new ComplaintImage();
                    ci.setComplaint(saved);
                    ci.setFilename(mf.getOriginalFilename());
                    ci.setContentType(mf.getContentType());
                    ci.setData(mf.getBytes());
                    complaintImageRepository.save(ci);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to store image: " + mf.getOriginalFilename());
                }
            }
        }
        // Minimal initial update record
        ComplaintUpdate update = new ComplaintUpdate();
        update.setComplaint(saved);
        update.setStatus(saved.getStatus());
        update.setComment("Created");
        update.setUpdatedBy(user);
        complaintUpdateRepository.save(update);
        return mapToDTO(saved);
    }

    @Transactional
    public ComplaintDTO updateComplaintStatus(Long id, UpdateStatusRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));

        Complaint.ComplaintStatus newStatus;
        try {
            newStatus = Complaint.ComplaintStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status value");
        }
        complaint.setStatus(newStatus);
        Complaint updated = complaintRepository.save(complaint);
        ComplaintUpdate update = new ComplaintUpdate();
        update.setComplaint(updated);
        update.setStatus(newStatus);
        update.setComment(request.getComment());
        update.setUpdatedBy(user);
        complaintUpdateRepository.save(update);
        return mapToDTO(updated);
    }

    public Page<ComplaintDTO> getAllComplaints(int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Complaint> complaints = complaintRepository.findAll(pageable);

        return complaints.map(this::mapToDTO);
    }

    public Page<ComplaintDTO> getComplaintsByUser(int page, int size) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Complaint> complaints = complaintRepository.findByUser(user, pageable);

        return complaints.map(this::mapToDTO);
    }

    public ComplaintDTO getComplaintById(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));

        return mapToDTO(complaint);
    }

    // Simplified: list updates directly via repository; method retained if controller expects it
    public List<ComplaintUpdate> getComplaintUpdates(Long complaintId) {
        return complaintUpdateRepository.findByComplaintComplaintIdOrderByCreatedAtDesc(complaintId);
    }

    public Page<ComplaintDTO> getComplaintsByCategory(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Complaint> complaints = complaintRepository.findByCategory(category, pageable);

        return complaints.map(this::mapToDTO);
    }

    public Page<ComplaintDTO> getComplaintsByStatus(String status, int page, int size) {
        Complaint.ComplaintStatus statusEnum;
        try {
            statusEnum = Complaint.ComplaintStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status value");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Complaint> complaints = complaintRepository.findByStatus(statusEnum, pageable);

        return complaints.map(this::mapToDTO);
    }

    public StatisticsDTO getStatistics() {
        Long totalComplaints = complaintRepository.count();

        // Adapt to current enum values: SUBMITTED, IN_PROGRESS, RESOLVED, ESCALATED
        Long submitted = complaintRepository.countByStatus(Complaint.ComplaintStatus.SUBMITTED);
        Long inProgress = complaintRepository.countByStatus(Complaint.ComplaintStatus.IN_PROGRESS);
        Long resolved = complaintRepository.countByStatus(Complaint.ComplaintStatus.RESOLVED);
        Long escalated = complaintRepository.countByStatus(Complaint.ComplaintStatus.ESCALATED);

        Map<String, Long> complaintsByCategory = new HashMap<>();
        List<Object[]> categoryStats = complaintRepository.countByCategory();
        for (Object[] stat : categoryStats) {
            String category = (String) stat[0];
            Long count = (Long) stat[1];
            complaintsByCategory.put(category, count);
        }

        // Build DTO
        StatisticsDTO dto = new StatisticsDTO();
        dto.setTotalComplaints(totalComplaints);
        dto.setPendingComplaints(submitted); // mapping submitted -> pending semantic
        dto.setInProgressComplaints(inProgress);
        dto.setResolvedComplaints(resolved);
        dto.setRejectedComplaints(escalated); // using escalated slot (no rejected concept yet)
        dto.setComplaintsByCategory(complaintsByCategory);

        // Status distribution map
        Map<String, Long> statusMap = new HashMap<>();
        statusMap.put("SUBMITTED", submitted);
        statusMap.put("IN_PROGRESS", inProgress);
        statusMap.put("RESOLVED", resolved);
        statusMap.put("ESCALATED", escalated);
        dto.setComplaintsByStatus(statusMap);

        // Top areas (reuse existing native query if present)
        try {
            List<Object[]> topAreasRaw = complaintRepository.findTopAreas();
            List<StatisticsDTO.TopAreaDTO> areas = topAreasRaw.stream().limit(10).map(r
                    -> new StatisticsDTO.TopAreaDTO(
                            ((Number) r[0]).doubleValue(),
                            ((Number) r[1]).doubleValue(),
                            ((Number) r[2]).longValue()
                    )
            ).toList();
            dto.setTopAreas(areas);
        } catch (Exception ignored) {
            // ignore if native query not compatible with current schema
        }
        return dto;
    }

    // Notification helpers removed due to entity mismatch (current Notification entity lacks these fields)
    @Transactional
    public ComplaintDTO addComment(Long complaintId, String comment) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + complaintId));

        // Create complaint update entry
        ComplaintUpdate update = new ComplaintUpdate();
        update.setComplaint(complaint);
        update.setStatus(complaint.getStatus());
        update.setComment(comment);
        update.setUpdatedBy(user);
        complaintUpdateRepository.save(update);

        return mapToDTO(complaint);
    }

    private ComplaintDTO mapToDTO(Complaint complaint) {
        return ComplaintDTO.from(complaint);
    }

    /**
     * Gets complaint data for map visualization with optional filtering
     *
     * @param boundingBox Map bounding box (minLat, maxLat, minLng, maxLng)
     * @param category Filter by category (optional)
     * @param status Filter by status (optional)
     * @param startDate Filter by start date (optional)
     * @param endDate Filter by end date (optional)
     * @return List of complaint map data
     */
    public List<ComplaintMapDTO> getComplaintsForMap(
            Double minLat, Double maxLat, Double minLng, Double maxLng,
            String category, String status, LocalDateTime startDate, LocalDateTime endDate) {
        List<Complaint> all = complaintRepository.findAll();
        return all.stream().filter(c -> {
            boolean ok = true;
            if (minLat != null) {
                ok &= c.getLocationLat() != null && c.getLocationLat() >= minLat;
            }
            if (maxLat != null) {
                ok &= c.getLocationLat() != null && c.getLocationLat() <= maxLat;
            }
            if (minLng != null) {
                ok &= c.getLocationLng() != null && c.getLocationLng() >= minLng;
            }
            if (maxLng != null) {
                ok &= c.getLocationLng() != null && c.getLocationLng() <= maxLng;
            }
            if (category != null && !category.isBlank()) {
                ok &= category.equalsIgnoreCase(c.getCategory());
            }
            if (status != null && !status.isBlank()) {
                try {
                    ok &= c.getStatus() == Complaint.ComplaintStatus.valueOf(status.toUpperCase());
                } catch (Exception ignored) {
                    ok = false;
                }
            }
            if (startDate != null) {
                ok &= c.getCreatedAt() != null && !c.getCreatedAt().isBefore(startDate);
            }
            if (endDate != null) {
                ok &= c.getCreatedAt() != null && !c.getCreatedAt().isAfter(endDate);
            }
            return ok;
        }).map(ComplaintMapDTO::fromComplaint).toList();
    }

    /**
     * Gets paginated list of escalated complaints
     *
     * @param page Page number
     * @param size Page size
     * @return Page of complaint DTOs
     */
    public Page<ComplaintDTO> getEscalatedComplaints(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Complaint> complaints = complaintRepository.findByStatus(Complaint.ComplaintStatus.ESCALATED, pageable);
        return complaints.map(ComplaintDTO::from);
    }

    /**
     * Adds feedback to a resolved complaint
     *
     * @param complaintId ID of the complaint
     * @param feedbackRequest Feedback and rating
     * @return Updated complaint DTO
     */
    @Transactional
    public ComplaintDTO addFeedback(Long complaintId, FeedbackRequest feedbackRequest) {
        // Get current user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get complaint
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Check if user owns the complaint
        if (!complaint.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("You can only provide feedback for your own complaints");
        }

        // Check if complaint is resolved
        if (complaint.getStatus() != Complaint.ComplaintStatus.RESOLVED) {
            throw new RuntimeException("You can only provide feedback for resolved complaints");
        }

        // Set feedback and rating
        complaint.setRating(feedbackRequest.getRating());
        complaint.setFeedback(feedbackRequest.getFeedback());

        // Save complaint
        complaintRepository.save(complaint);

        // Add complaint update
        ComplaintUpdate update = new ComplaintUpdate();
        update.setComplaint(complaint);
        update.setUpdatedBy(user);
        complaintUpdateRepository.save(update);

        return ComplaintDTO.from(complaint);
    }

    /**
     * Reopens a resolved complaint
     *
     * @param complaintId ID of the complaint
     * @param reopenReason Reason for reopening
     * @return Updated complaint DTO
     */
    @Transactional
    public ComplaintDTO reopenComplaint(Long complaintId, String reopenReason) {
        // Get current user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get complaint
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Check if user owns the complaint
        if (!complaint.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("You can only reopen your own complaints");
        }

        // Check if complaint is resolved
        if (complaint.getStatus() != Complaint.ComplaintStatus.RESOLVED) {
            throw new RuntimeException("You can only reopen resolved complaints");
        }

        // Check if there's a rating and it's low enough to justify reopening
        if (complaint.getRating() != null && complaint.getRating() > 2) {
            throw new RuntimeException("You can only reopen complaints with low satisfaction ratings (1-2)");
        }

        // Set complaint to reopened
        complaint.setStatus(Complaint.ComplaintStatus.IN_PROGRESS);
        complaint.setReopened(true);
        complaint.setReopenReason(reopenReason);
        complaint.setUpdatedAt(LocalDateTime.now());

        // Save complaint
        complaintRepository.save(complaint);

        // Add complaint update
        ComplaintUpdate update = new ComplaintUpdate();
        update.setComplaint(complaint);
        update.setUpdatedBy(user);
        update.setComment("Complaint reopened: " + reopenReason);
        complaintUpdateRepository.save(update);

        // Notify staff/admin about the reopened complaint
        // Notification omitted
        return ComplaintDTO.from(complaint);
    }

    /**
     * Gets complaints by rating range
     *
     * @param minRating Minimum rating
     * @param maxRating Maximum rating
     * @param page Page number
     * @param size Page size
     * @return Page of complaint DTOs
     */
    public Page<ComplaintDTO> getComplaintsByRatingRange(Integer minRating, Integer maxRating, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Complaint> complaints = complaintRepository.findByRatingBetweenAndStatusOrderByCreatedAtDesc(
                minRating, maxRating, Complaint.ComplaintStatus.RESOLVED, pageable);
        return complaints.map(ComplaintDTO::from);
    }

    /**
     * Creates a notification for staff/admin when a complaint is reopened
     *
     * @param complaint The reopened complaint
     */
    // Removed notification creation & duplicate detection (dependencies unavailable)
}

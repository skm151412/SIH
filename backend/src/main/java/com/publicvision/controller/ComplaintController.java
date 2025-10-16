package com.publicvision.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.publicvision.dto.CommentRequest;
import com.publicvision.dto.ComplaintDTO;
import com.publicvision.dto.ComplaintRequest;
import com.publicvision.dto.FeedbackRequest;
import com.publicvision.dto.ReopenRequest;
import com.publicvision.dto.StatisticsDTO;
import com.publicvision.dto.UpdateStatusRequest;
import com.publicvision.entity.ComplaintUpdate;
import com.publicvision.entity.ComplaintImage;
import com.publicvision.repository.ComplaintImageRepository;
import com.publicvision.service.ComplaintService;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private ComplaintImageRepository complaintImageRepository;

    @PostMapping(value = "/create", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ComplaintDTO> createComplaint(
            @RequestPart("complaint") @Valid ComplaintRequest complaintRequest,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        ComplaintDTO complaint = complaintService.createComplaint(complaintRequest, images);
        return ResponseEntity.ok(complaint);
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ComplaintDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        ComplaintDTO complaint = complaintService.updateComplaintStatus(id, request);
        return ResponseEntity.ok(complaint);
    }

    @GetMapping
    public ResponseEntity<Page<ComplaintDTO>> getAllComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Page<ComplaintDTO> complaints = complaintService.getAllComplaints(page, size, sortBy, direction);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/my")
    public ResponseEntity<Page<ComplaintDTO>> getMyComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ComplaintDTO> complaints = complaintService.getComplaintsByUser(page, size);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintDTO> getComplaintById(@PathVariable Long id) {
        ComplaintDTO complaint = complaintService.getComplaintById(id);
        return ResponseEntity.ok(complaint);
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<List<Long>> getImageIds(@PathVariable Long id) {
        List<Long> ids = complaintImageRepository.findByComplaint_ComplaintId(id)
                .stream().map(ComplaintImage::getId).toList();
        return ResponseEntity.ok(ids);
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<byte[]> getImage(@PathVariable Long imageId) {
        ComplaintImage img = complaintImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));
        return ResponseEntity.ok()
                .header("Content-Type", img.getContentType())
                .header("Content-Disposition", "inline; filename=\"" + img.getFilename() + "\"")
                .body(img.getData());
    }

    @GetMapping("/{id}/updates")
    public ResponseEntity<List<ComplaintUpdate>> getComplaintUpdates(@PathVariable Long id) {
        List<ComplaintUpdate> updates = complaintService.getComplaintUpdates(id);
        return ResponseEntity.ok(updates);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<Page<ComplaintDTO>> getComplaintsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ComplaintDTO> complaints = complaintService.getComplaintsByCategory(category, page, size);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<Page<ComplaintDTO>> getComplaintsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ComplaintDTO> complaints = complaintService.getComplaintsByStatus(status, page, size);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<StatisticsDTO> getStatistics() {
        StatisticsDTO statistics = complaintService.getStatistics();
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/public/recent")
    public ResponseEntity<Page<ComplaintDTO>> getRecentComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ComplaintDTO> complaints = complaintService.getAllComplaints(page, size, "createdAt", "desc");
        return ResponseEntity.ok(complaints);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ComplaintDTO> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest commentRequest) {
        ComplaintDTO complaint = complaintService.addComment(id, commentRequest.getText());
        return ResponseEntity.ok(complaint);
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<ComplaintDTO> addFeedback(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackRequest feedbackRequest) {
        ComplaintDTO complaint = complaintService.addFeedback(id, feedbackRequest);
        return ResponseEntity.ok(complaint);
    }

    @PostMapping("/{id}/reopen")
    public ResponseEntity<ComplaintDTO> reopenComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ReopenRequest reopenRequest) {
        ComplaintDTO complaint = complaintService.reopenComplaint(id, reopenRequest.getReopenReason());
        return ResponseEntity.ok(complaint);
    }

    @GetMapping("/ratings")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Page<ComplaintDTO>> getComplaintsByRating(
            @RequestParam(defaultValue = "0") Integer minRating,
            @RequestParam(defaultValue = "5") Integer maxRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ComplaintDTO> complaints = complaintService.getComplaintsByRatingRange(minRating, maxRating, page, size);
        return ResponseEntity.ok(complaints);
    }
}

package com.publicvision.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.publicvision.dto.DuplicateComplaintDTO;
import com.publicvision.service.DuplicateComplaintService;

/**
 * Controller for handling duplicate complaint operations
 */
@RestController
@RequestMapping("/api/complaints")
public class DuplicateComplaintController {

    @Autowired
    private DuplicateComplaintService duplicateComplaintService;

    /**
     * Get duplicates for a specific complaint
     *
     * @param id Complaint ID
     * @return DuplicateComplaintDTO containing the original and its duplicates
     */
    @GetMapping("/{id}/duplicates")
    public ResponseEntity<DuplicateComplaintDTO> getDuplicatesForComplaint(
            @PathVariable("id") Long id) {

        DuplicateComplaintDTO duplicates = duplicateComplaintService.getDuplicatesForComplaint(id);
        return ResponseEntity.ok(duplicates);
    }

    /**
     * Merge multiple complaints as duplicates of a specific complaint
     *
     * @param id Original complaint ID
     * @param duplicateIds List of duplicate complaint IDs to merge
     * @return Updated DuplicateComplaintDTO
     */
    @PostMapping("/{id}/merge-duplicates")
    public ResponseEntity<DuplicateComplaintDTO> mergeDuplicates(
            @PathVariable("id") Long id,
            @RequestBody List<Long> duplicateIds) {

        DuplicateComplaintDTO result = duplicateComplaintService.mergeComplaints(id, duplicateIds);
        return ResponseEntity.ok(result);
    }
}

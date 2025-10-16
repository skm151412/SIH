package com.publicvision.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.publicvision.dto.ComplaintDTO;
import com.publicvision.dto.ComplaintMapDTO;
import com.publicvision.service.ComplaintService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private ComplaintService complaintService;

    /**
     * Endpoint to retrieve complaint data for map visualization
     *
     * @param minLat Minimum latitude for bounding box
     * @param maxLat Maximum latitude for bounding box
     * @param minLng Minimum longitude for bounding box
     * @param maxLng Maximum longitude for bounding box
     * @param category Filter by category (optional)
     * @param status Filter by status (optional)
     * @param startDate Filter by start date (optional)
     * @param endDate Filter by end date (optional)
     * @return List of complaint data for map visualization
     */
    @GetMapping("/complaints/mapdata")
    public ResponseEntity<List<ComplaintMapDTO>> getMapData(
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLat,
            @RequestParam(required = false) Double minLng,
            @RequestParam(required = false) Double maxLng,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        List<ComplaintMapDTO> mapData = complaintService.getComplaintsForMap(
                minLat, maxLat, minLng, maxLng,
                category, status, startDate, endDate);

        return ResponseEntity.ok(mapData);
    }

    /**
     * Endpoint to retrieve escalated complaints
     *
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of escalated complaints
     */
    @GetMapping("/escalated")
    public ResponseEntity<Page<ComplaintDTO>> getEscalatedComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<ComplaintDTO> complaints = complaintService.getEscalatedComplaints(page, size);
        return ResponseEntity.ok(complaints);
    }
}

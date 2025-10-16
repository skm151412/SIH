package com.publicvision.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.publicvision.dto.ExportFilterRequest;
import com.publicvision.service.ExportService;

@RestController
@RequestMapping("/api/admin/export")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExportController {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @Autowired
    private ExportService exportService;

    /**
     * Export complaints data as CSV or PDF based on filters
     *
     * @param filterRequest Filter criteria for export
     * @return Downloadable file with complaints data
     */
    @PostMapping
    public ResponseEntity<byte[]> exportComplaints(@RequestBody ExportFilterRequest filterRequest) {
        try {
            byte[] fileContent = exportService.exportComplaints(filterRequest);
            String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
            String filename = "complaints_" + timestamp;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentDispositionFormData("attachment",
                    filename + ("PDF".equalsIgnoreCase(filterRequest.getExportFormat()) ? ".pdf" : ".csv"));

            if ("PDF".equalsIgnoreCase(filterRequest.getExportFormat())) {
                headers.setContentType(MediaType.APPLICATION_PDF);
            } else {
                headers.setContentType(MediaType.parseMediaType("text/csv"));
            }

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            // Log the error instead of printing stack trace
            System.err.println("Error exporting complaints: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

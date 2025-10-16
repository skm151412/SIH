package com.publicvision.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.publicvision.dto.ExportFilterRequest;
import com.publicvision.entity.Complaint;
import com.publicvision.entity.Complaint.ComplaintStatus;
import com.publicvision.repository.ComplaintRepository;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String[] CSV_HEADERS = {"Complaint ID", "User", "Category", "Description", "Location",
        "Status", "Created At", "Resolved At", "Rating", "Reopened"};

    @Autowired
    private ComplaintRepository complaintRepository;

    /**
     * Export complaints as CSV or PDF based on filter criteria
     *
     * @param filters Filter criteria
     * @return Byte array of the exported file
     * @throws IOException If an I/O error occurs
     */
    @Transactional(readOnly = true)
    public byte[] exportComplaints(ExportFilterRequest filters) throws IOException, DocumentException {
        List<Complaint> complaints = getFilteredComplaints(filters);

        if ("PDF".equalsIgnoreCase(filters.getExportFormat())) {
            return generatePdf(complaints);
        } else {
            // Default to CSV
            return generateCsv(complaints);
        }
    }

    /**
     * Get filtered complaints based on criteria
     *
     * @param filters Filter criteria
     * @return List of complaints
     */
    private List<Complaint> getFilteredComplaints(ExportFilterRequest filters) {
        LocalDateTime startDate = filters.getStartDate();
        LocalDateTime endDate = filters.getEndDate();
        String category = filters.getCategory();
        String statusStr = filters.getStatus();

        // Build query based on filters
        if (startDate == null) {
            // Default to last 30 days if no start date
            startDate = LocalDateTime.now().minusDays(30);
        }

        if (endDate == null) {
            // Default to now if no end date
            endDate = LocalDateTime.now();
        }

        ComplaintStatus status = null;
        if (statusStr != null && !statusStr.isEmpty()) {
            try {
                status = ComplaintStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, will ignore this filter
            }
        }

        if (category != null && !category.isEmpty() && status != null) {
            return complaintRepository.findByStatusAndCategoryAndCreatedAtBetween(
                    status, category, startDate, endDate);
        } else if (category != null && !category.isEmpty()) {
            return complaintRepository.findByCategoryAndCreatedAtBetween(
                    category, startDate, endDate);
        } else if (status != null) {
            return complaintRepository.findByStatusAndCreatedAtBetween(
                    status, startDate, endDate);
        } else {
            return complaintRepository.findByCreatedAtBetween(startDate, endDate);
        }
    }

    /**
     * Generate CSV file from complaints
     *
     * @param complaints List of complaints
     * @return Byte array of CSV file
     * @throws IOException If an I/O error occurs
     */
    private byte[] generateCsv(List<Complaint> complaints) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader(CSV_HEADERS)
                .build();

        try (CSVPrinter csvPrinter = new CSVPrinter(
                new OutputStreamWriter(out, StandardCharsets.UTF_8), csvFormat)) {

            for (Complaint complaint : complaints) {
                csvPrinter.printRecord(
                        complaint.getComplaintId(),
                        complaint.getUser().getName(),
                        complaint.getCategory(),
                        complaint.getDescription(),
                        formatLocation(complaint),
                        complaint.getStatus(),
                        formatDateTime(complaint.getCreatedAt()),
                        formatDateTime(complaint.getStatus() == ComplaintStatus.RESOLVED ? complaint.getUpdatedAt() : null),
                        complaint.getRating() != null ? complaint.getRating() : "N/A",
                        complaint.getReopened() != null ? complaint.getReopened() : "No"
                );
            }

            csvPrinter.flush();
            return out.toByteArray();
        }
    }

    /**
     * Generate PDF file from complaints
     *
     * @param complaints List of complaints
     * @return Byte array of PDF file
     * @throws DocumentException If a document error occurs
     */
    private byte[] generatePdf(List<Complaint> complaints) throws DocumentException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate());

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Add title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Complaints Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            // Add generation date
            Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Paragraph dateP = new Paragraph("Generated on: "
                    + formatDateTime(LocalDateTime.now()), dateFont);
            dateP.setAlignment(Element.ALIGN_RIGHT);
            document.add(dateP);
            document.add(Chunk.NEWLINE);

            // Create table
            PdfPTable table = new PdfPTable(CSV_HEADERS.length);
            table.setWidthPercentage(100);

            // Set table header widths
            float[] columnWidths = {5, 8, 7, 25, 15, 7, 10, 10, 5, 8};
            table.setWidths(columnWidths);

            // Add headers
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
            for (String header : CSV_HEADERS) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
                table.addCell(cell);
            }

            // Add data rows
            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (Complaint complaint : complaints) {
                table.addCell(new Phrase(String.valueOf(complaint.getComplaintId()), dataFont));
                table.addCell(new Phrase(complaint.getUser().getName(), dataFont));
                table.addCell(new Phrase(complaint.getCategory(), dataFont));

                // Limit description length for better formatting
                String description = complaint.getDescription();
                if (description.length() > 100) {
                    description = description.substring(0, 97) + "...";
                }
                table.addCell(new Phrase(description, dataFont));

                table.addCell(new Phrase(formatLocation(complaint), dataFont));
                table.addCell(new Phrase(complaint.getStatus().toString(), dataFont));
                table.addCell(new Phrase(formatDateTime(complaint.getCreatedAt()), dataFont));
                table.addCell(new Phrase(formatDateTime(complaint.getStatus() == ComplaintStatus.RESOLVED ? complaint.getUpdatedAt() : null), dataFont));
                table.addCell(new Phrase(complaint.getRating() != null ? complaint.getRating().toString() : "N/A", dataFont));
                table.addCell(new Phrase(complaint.getReopened() != null && complaint.getReopened() ? "Yes" : "No", dataFont));
            }

            document.add(table);

            // Add footer with count
            document.add(Chunk.NEWLINE);
            Paragraph count = new Paragraph("Total Complaints: " + complaints.size(), dateFont);
            count.setAlignment(Element.ALIGN_RIGHT);
            document.add(count);

        } finally {
            document.close();
        }

        return out.toByteArray();
    }

    /**
     * Format datetime for display
     *
     * @param dateTime LocalDateTime
     * @return Formatted date string
     */
    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_FORMATTER) : "N/A";
    }

    /**
     * Format location for display
     *
     * @param complaint Complaint
     * @return Formatted location
     */
    private String formatLocation(Complaint complaint) {
        if (complaint.getLocationLat() != null && complaint.getLocationLng() != null) {
            return String.format("Lat: %.6f, Lng: %.6f",
                    complaint.getLocationLat(), complaint.getLocationLng());
        } else {
            return "Unknown";
        }
    }
}

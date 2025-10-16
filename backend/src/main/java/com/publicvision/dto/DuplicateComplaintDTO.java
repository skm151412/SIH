package com.publicvision.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.publicvision.entity.Complaint;

/**
 * DTO for returning duplicates for a complaint
 */
public class DuplicateComplaintDTO {

    private ComplaintDTO originalComplaint;
    private List<ComplaintDTO> duplicateComplaints;
    private int totalDuplicates;

    public DuplicateComplaintDTO() {
    }

    public DuplicateComplaintDTO(ComplaintDTO originalComplaint, List<ComplaintDTO> duplicateComplaints, int totalDuplicates) {
        this.originalComplaint = originalComplaint;
        this.duplicateComplaints = duplicateComplaints;
        this.totalDuplicates = totalDuplicates;
    }

    public ComplaintDTO getOriginalComplaint() {
        return originalComplaint;
    }

    public void setOriginalComplaint(ComplaintDTO originalComplaint) {
        this.originalComplaint = originalComplaint;
    }

    public List<ComplaintDTO> getDuplicateComplaints() {
        return duplicateComplaints;
    }

    public void setDuplicateComplaints(List<ComplaintDTO> duplicateComplaints) {
        this.duplicateComplaints = duplicateComplaints;
    }

    public int getTotalDuplicates() {
        return totalDuplicates;
    }

    public void setTotalDuplicates(int totalDuplicates) {
        this.totalDuplicates = totalDuplicates;
    }

    /**
     * Create a DuplicateComplaintDTO from an original complaint and its
     * duplicates
     *
     * @param originalComplaint The original complaint
     * @param duplicates List of duplicate complaints
     * @return DuplicateComplaintDTO
     */
    public static DuplicateComplaintDTO fromComplaints(Complaint originalComplaint, List<Complaint> duplicates) {
        DuplicateComplaintDTO dto = new DuplicateComplaintDTO();
        dto.setOriginalComplaint(ComplaintDTO.from(originalComplaint));

        List<ComplaintDTO> duplicateDtos = duplicates.stream()
                .map(ComplaintDTO::from)
                .collect(Collectors.toList());

        dto.setDuplicateComplaints(duplicateDtos);
        dto.setTotalDuplicates(duplicateDtos.size());

        return dto;
    }
}

package com.publicvision.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.publicvision.entity.Complaint;
import com.publicvision.entity.ComplaintUpdate;

@Repository
public interface ComplaintUpdateRepository extends JpaRepository<ComplaintUpdate, Long> {

    List<ComplaintUpdate> findByComplaintComplaintIdOrderByCreatedAtDesc(Long complaintId);

    Page<ComplaintUpdate> findByComplaintComplaintId(Long complaintId, Pageable pageable);
}

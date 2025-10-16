package com.publicvision.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.publicvision.entity.ComplaintImage;

@Repository
public interface ComplaintImageRepository extends JpaRepository<ComplaintImage, Long> {

    List<ComplaintImage> findByComplaint_ComplaintId(Long complaintId);
}

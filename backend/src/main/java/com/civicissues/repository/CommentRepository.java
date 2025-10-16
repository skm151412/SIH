package com.civicissues.repository;

import com.civicissues.domain.model.Comment;
import com.civicissues.domain.model.Complaint;
import com.civicissues.domain.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByComplaintOrderByCreatedAtAsc(Complaint complaint);

    Page<Comment> findByComplaint(Complaint complaint, Pageable pageable);

    List<Comment> findByUser(User user);

    @Query("SELECT c FROM Comment c WHERE c.isOfficial = true AND c.complaint = :complaint ORDER BY c.createdAt ASC")
    List<Comment> findOfficialCommentsByComplaint(Complaint complaint);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.complaint = :complaint")
    Long countByComplaint(Complaint complaint);

    @Query("SELECT c FROM Comment c WHERE c.createdAt >= :startDate AND c.createdAt <= :endDate")
    List<Comment> findByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT c.complaint.id, COUNT(c) FROM Comment c GROUP BY c.complaint.id ORDER BY COUNT(c) DESC")
    List<Object[]> findComplaintsWithMostComments(Pageable pageable);
}

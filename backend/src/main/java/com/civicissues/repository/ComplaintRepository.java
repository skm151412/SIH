package com.civicissues.repository;

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
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Page<Complaint> findByReporter(User reporter, Pageable pageable);

    Page<Complaint> findByAssignedTo(User assignedTo, Pageable pageable);

    Page<Complaint> findByStatus(Complaint.Status status, Pageable pageable);

    Page<Complaint> findByCategory(Complaint.Category category, Pageable pageable);

    Page<Complaint> findByPriority(Complaint.Priority priority, Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE "
            + "(:title IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND "
            + "(:status IS NULL OR c.status = :status) AND "
            + "(:category IS NULL OR c.category = :category) AND "
            + "(:priority IS NULL OR c.priority = :priority)")
    Page<Complaint> searchComplaints(String title, Complaint.Status status,
            Complaint.Category category, Complaint.Priority priority,
            Pageable pageable);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = :status")
    Long countByStatus(Complaint.Status status);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.category = :category")
    Long countByCategory(Complaint.Category category);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE DATE(c.createdAt) = CURRENT_DATE")
    Long countNewComplaintsToday();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = :status AND c.assignedTo = :assignedTo")
    Long countByStatusAndAssignedTo(Complaint.Status status, User assignedTo);

    @Query("SELECT c FROM Complaint c WHERE c.status <> 'RESOLVED' AND c.status <> 'REJECTED' AND c.status <> 'DUPLICATE' ORDER BY c.priority DESC, c.createdAt ASC")
    Page<Complaint> findActiveComplaints(Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL")
    List<Complaint> findWithGeoLocation();

    @Query("SELECT c FROM Complaint c WHERE c.createdAt >= :startDate AND c.createdAt <= :endDate")
    List<Complaint> findByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT c.category, COUNT(c) FROM Complaint c GROUP BY c.category ORDER BY COUNT(c) DESC")
    List<Object[]> countByCategories();

    @Query("SELECT c.status, COUNT(c) FROM Complaint c GROUP BY c.status")
    List<Object[]> countByStatuses();
}

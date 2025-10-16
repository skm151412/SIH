package com.publicvision.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.publicvision.entity.Complaint;
import com.publicvision.entity.Complaint.ComplaintStatus;
import com.publicvision.entity.User;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Page<Complaint> findByUser(User user, Pageable pageable);

    Page<Complaint> findByStatus(ComplaintStatus status, Pageable pageable);

    long countByStatus(ComplaintStatus status);

    Page<Complaint> findByCategory(String category, Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE c.category = :category AND c.createdAt BETWEEN :startDate AND :endDate")
    Page<Complaint> findByCategoryBetweenDates(
            @Param("category") String category,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE "
            + "c.locationLat BETWEEN :minLat AND :maxLat AND "
            + "c.locationLng BETWEEN :minLng AND :maxLng")
    List<Complaint> findNearby(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng);

    @Query("SELECT c FROM Complaint c WHERE "
            + "(:minLat IS NULL OR c.locationLat >= :minLat) AND "
            + "(:maxLat IS NULL OR c.locationLat <= :maxLat) AND "
            + "(:minLng IS NULL OR c.locationLng >= :minLng) AND "
            + "(:maxLng IS NULL OR c.locationLng <= :maxLng) AND "
            + "(:category IS NULL OR c.category = :category) AND "
            + "(:status IS NULL OR c.status = :status) AND "
            + "(:startDate IS NULL OR c.createdAt >= :startDate) AND "
            + "(:endDate IS NULL OR c.createdAt <= :endDate)")
    List<Complaint> findComplaintsForMap(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng,
            @Param("category") String category,
            @Param("status") ComplaintStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c FROM Complaint c WHERE "
            + "c.category = :category AND "
            + "ABS(c.locationLat - :lat) < :latDistance AND "
            + "ABS(c.locationLng - :lng) < :lngDistance AND "
            + "c.createdAt > :cutoffDate AND "
            + "c.isDuplicate = false")
    List<Complaint> findPotentialDuplicates(
            @Param("category") String category,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("latDistance") Double latDistance,
            @Param("lngDistance") Double lngDistance,
            @Param("cutoffDate") LocalDateTime cutoffDate);

    @Query("SELECT c.category, COUNT(c) FROM Complaint c GROUP BY c.category")
    List<Object[]> countByCategory();

    @Query("SELECT c.status, COUNT(c) FROM Complaint c GROUP BY c.status")
    List<Object[]> countByStatus();

    @Query(value = "SELECT ROUND(location_lat, 3) AS lat_grid, "
            + "ROUND(location_lng, 3) AS lng_grid, "
            + "COUNT(*) AS count "
            + "FROM complaints "
            + "GROUP BY lat_grid, lng_grid "
            + "ORDER BY count DESC LIMIT 10", nativeQuery = true)
    List<Object[]> findTopAreas();

    // Fixed JPQL: comparing enum via its persisted String value to avoid nested enum FQN parsing issues
    @Query("SELECT c FROM Complaint c WHERE c.status <> 'RESOLVED' AND c.escalated = false AND c.dueDate < :currentTime")
    List<Complaint> findOverdueComplaints(@Param("currentTime") LocalDateTime currentTime);

    Page<Complaint> findByEscalatedTrue(Pageable pageable);

    Page<Complaint> findByRatingBetweenAndStatusOrderByCreatedAtDesc(Integer minRating, Integer maxRating, ComplaintStatus status, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.rating IS NOT NULL GROUP BY c.rating")
    List<Object[]> countComplaintsByRating();

    /**
     * Find potential duplicate complaints within a specific distance, category
     * and timeframe
     *
     * @param category The complaint category
     * @param lat Latitude of the new complaint
     * @param lng Longitude of the new complaint
     * @param cutoffDate The date threshold (e.g., 48 hours ago)
     * @return List of potential duplicate complaints
     */
    @Query(value = "SELECT * FROM complaints c WHERE "
            + "c.category = :category AND "
            + "c.created_at > :cutoffDate AND "
            + "c.is_duplicate = false AND "
            + "(6371 * acos(cos(radians(:lat)) * cos(radians(c.location_lat)) * "
            + "cos(radians(c.location_lng) - radians(:lng)) + "
            + "sin(radians(:lat)) * sin(radians(c.location_lat)))) < :distanceKm "
            + "ORDER BY c.created_at DESC", nativeQuery = true)
    List<Complaint> findPotentialDuplicates(
            @Param("category") String category,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("distanceKm") Double distanceKm,
            @Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Find all complaints that are duplicates of a specific original complaint
     *
     * @param originalComplaintId The ID of the original complaint
     * @return List of duplicate complaints
     */
    List<Complaint> findByOriginalComplaintComplaintId(Long originalComplaintId);

    /**
     * Find complaints by status, category and created date between range
     *
     * @param status The complaint status
     * @param category The complaint category
     * @param startDate Start date for filtering
     * @param endDate End date for filtering
     * @return List of complaints matching criteria
     */
    List<Complaint> findByStatusAndCategoryAndCreatedAtBetween(
            ComplaintStatus status, String category, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find complaints by category between dates
     *
     * @param category The complaint category
     * @param startDate Start date for filtering
     * @param endDate End date for filtering
     * @return List of complaints matching criteria
     */
    List<Complaint> findByCategoryAndCreatedAtBetween(
            String category, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find complaints by status between dates
     *
     * @param status The complaint status
     * @param startDate Start date for filtering
     * @param endDate End date for filtering
     * @return List of complaints matching criteria
     */
    List<Complaint> findByStatusAndCreatedAtBetween(
            ComplaintStatus status, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find complaints between dates
     *
     * @param startDate Start date for filtering
     * @param endDate End date for filtering
     * @return List of complaints matching criteria
     */
    List<Complaint> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
}

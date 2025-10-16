package com.publicvision.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.publicvision.entity.Notification;
import com.publicvision.entity.User;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUser(User user, Pageable pageable);

    List<Notification> findByUserOrderBySentAtDesc(User user);

    List<Notification> findByUserAndIsReadFalse(User user);

    Long countByUserAndIsReadFalse(User user);

    List<Notification> findByUserUserIdOrderBySentAtDesc(Long userId);

    List<Notification> findByComplaintComplaintId(Long complaintId);
}

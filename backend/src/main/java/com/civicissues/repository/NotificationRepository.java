package com.civicissues.repository;

import com.civicissues.domain.model.Notification;
import com.civicissues.domain.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    List<Notification> findByRecipientAndReadOrderByCreatedAtDesc(User recipient, boolean read);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient = :recipient AND n.read = false")
    Long countUnreadNotifications(User recipient);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :recipient")
    void markAllAsRead(User recipient);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.recipient = :recipient")
    void markAsRead(Long id, User recipient);

    @Query("SELECT n FROM Notification n WHERE n.recipient = :recipient AND n.type = :type ORDER BY n.createdAt DESC")
    List<Notification> findByRecipientAndType(User recipient, Notification.NotificationType type);
}

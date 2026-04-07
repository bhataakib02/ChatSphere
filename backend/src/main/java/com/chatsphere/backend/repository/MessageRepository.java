package com.chatsphere.backend.repository;

import com.chatsphere.backend.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChat_IdOrderByCreatedAtAsc(Long chatId);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.status = 'READ' WHERE m.chat.id = :chatId AND m.sender.id <> :userId AND m.status <> 'READ'")
    int markMessagesAsRead(@Param("chatId") Long chatId, @Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Message m WHERE m.type <> 'TEXT' AND m.createdAt < :cutoff")
    int deleteOldMedia(@Param("cutoff") LocalDateTime cutoff);

    @Query(value = "SELECT CAST(created_at AS DATE) as date, COUNT(id) as count FROM messages WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' GROUP BY CAST(created_at AS DATE) ORDER BY date ASC", nativeQuery = true)
    List<Object[]> countMessagesPerDayLast7Days();

    long countBySenderId(Long senderId);
}

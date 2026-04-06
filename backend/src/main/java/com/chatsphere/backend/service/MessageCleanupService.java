package com.chatsphere.backend.service;

import com.chatsphere.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class MessageCleanupService {
    @Autowired private MessageRepository messageRepository;

    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupOldMedia() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        int deleted = messageRepository.deleteOldMedia(cutoff);
        System.out.println("Cleaned up " + deleted + " old media messages.");
    }
}

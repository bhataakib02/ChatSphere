package com.chatsphere.backend.service;

import com.chatsphere.backend.repository.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class MessageCleanupService {
    private static final Logger log = LoggerFactory.getLogger(MessageCleanupService.class);

    @Autowired
    private MessageRepository messageRepository;

    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupOldMedia() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        int deleted = messageRepository.deleteOldMedia(cutoff);
        log.info("Cleaned up {} old media messages.", deleted);
    }
}

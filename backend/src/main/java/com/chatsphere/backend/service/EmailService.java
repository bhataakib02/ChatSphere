package com.chatsphere.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    public void sendVerificationCode(String email, String code) {
        // In a real app, use JavaMailSender. For this premium demo, we log it clearly.
        logger.info("========================================");
        logger.info("TO: {}", email);
        logger.info("SUBJECT: Duo Space - Verify Your Email");
        logger.info("BODY: Your Duo verification code is: {}", code);
        logger.info("========================================");
    }

    public void sendPasswordResetCode(String email, String code) {
        logger.info("========================================");
        logger.info("TO: {}", email);
        logger.info("SUBJECT: Duo Space - Password Recovery");
        logger.info("BODY: Your password reset code is: {}", code);
        logger.info("========================================");
    }
}

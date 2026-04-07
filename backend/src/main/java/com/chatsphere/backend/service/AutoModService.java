package com.chatsphere.backend.service;

import com.chatsphere.backend.model.Message;
import com.chatsphere.backend.model.Report;
import com.chatsphere.backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;

@Service
public class AutoModService {

    @Autowired
    private ReportRepository reportRepository;

    private static final List<String> BLACKLIST = Arrays.asList("spam", "scam", "offensive", "abuse", "hate", "phishing");

    public void scanAndFlag(Message message) {
        if (message.getContent() == null) return;

        String content = message.getContent().toLowerCase();
        for (String keyword : BLACKLIST) {
            if (content.contains(keyword)) {
                autoFlag(message, "Automated Warning: Suspicious keyword '" + keyword + "' detected.");
                break;
            }
        }
        
        // Simple rate limit detection simulation logic can be added here
    }

    private void autoFlag(Message message, String reason) {
        Report report = new Report();
        report.setReporterId(0L); // 0 = SYSTEM
        report.setReportedUserId(message.getSender().getId());
        report.setMessageContent(message.getContent());
        report.setReason(reason);
        report.setStatus(Report.EReportStatus.PENDING);
        reportRepository.save(report);
    }
}

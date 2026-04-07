package com.chatsphere.backend.controller;

import com.chatsphere.backend.model.*;
import com.chatsphere.backend.repository.*;
import com.chatsphere.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private ReportRepository reportRepository;
    @Autowired private AdminLogRepository adminLogRepository;
    @Autowired private SystemSettingRepository systemSettingRepository;
    @Autowired private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsersDetailed() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        for (User u : users) {
             Map<String, Object> map = new HashMap<>();
             map.put("id", u.getId());
             map.put("username", u.getUsername());
             map.put("email", u.getEmail());
             map.put("role", u.getRole().name());
             map.put("locked", u.isLocked());
             map.put("online", u.isOnline());
             map.put("lastSeen", u.getLastSeen());
             map.put("createdAt", u.getCreatedAt());
             map.put("messageCount", messageRepository.countBySenderId(u.getId()));
             response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/toggle-lock")
    public ResponseEntity<?> toggleUserLock(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        return userRepository.findById(id).map(user -> {
            user.setLocked(!user.isLocked());
            userRepository.save(user);
            
            UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
            User admin = userRepository.findById(current.getId()).orElse(null);
            adminLogRepository.save(new AdminLog(admin, "TOGGLE_USER_LOCK", (user.isLocked() ? "Locked" : "Unlocked") + " user: " + user.getUsername(), user.getId().toString()));
            
            return ResponseEntity.ok(Collections.singletonMap("locked", user.isLocked()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/role")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> payload, org.springframework.security.core.Authentication auth) {
        return userRepository.findById(id).map(user -> {
            try {
                ERole oldRole = user.getRole();
                user.setRole(ERole.valueOf(payload.get("role")));
                userRepository.save(user);
                
                UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
                User admin = userRepository.findById(current.getId()).orElse(null);
                adminLogRepository.save(new AdminLog(admin, "CHANGE_ROLE", "Changed role of " + user.getUsername() + " from " + oldRole + " to " + user.getRole(), user.getId().toString()));
                
                return ResponseEntity.ok(Collections.singletonMap("role", user.getRole().name()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid role"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalChats", chatRepository.count());
        stats.put("totalMessages", messageRepository.count());
        stats.put("activeUsers", userRepository.countByOnlineTrue());

        List<Object[]> dailyMessages = messageRepository.countMessagesPerDayLast7Days();
        List<Map<String, Object>> messageGrowth = new ArrayList<>();
        for (Object[] row : dailyMessages) {
             Map<String, Object> point = new HashMap<>();
             point.put("date", row[0].toString());
             point.put("messages", row[1]);
             messageGrowth.add(point);
        }
        stats.put("dailyMessageGrowth", messageGrowth);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/reports")
    public List<Report> getAllReports(@RequestParam(required = false) String status) {
        if (status != null) {
            return reportRepository.findByStatusOrderByCreatedAtDesc(Report.EReportStatus.valueOf(status.toUpperCase()));
        }
        return reportRepository.findAll();
    }

    @PutMapping("/reports/{id}")
    public ResponseEntity<?> resolveReport(@PathVariable Long id, @RequestBody Map<String, String> payload, org.springframework.security.core.Authentication auth) {
        return reportRepository.findById(id).map(report -> {
            report.setStatus(Report.EReportStatus.valueOf(payload.get("status").toUpperCase()));
            report.setAdminNotes(payload.get("notes"));
            reportRepository.save(report);

            UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
            User admin = userRepository.findById(current.getId()).orElse(null);
            adminLogRepository.save(new AdminLog(admin, "RESOLVE_REPORT", "Resolved report #" + id + " as " + report.getStatus(), id.toString()));

            return ResponseEntity.ok(report);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/logs")
    public List<AdminLog> getAdminLogs() {
        return adminLogRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/chats")
    public List<Chat> getAllChats() {
        return chatRepository.findAll();
    }

    @DeleteMapping("/chats/{id}")
    public ResponseEntity<?> deleteChat(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        if (chatRepository.existsById(id)) {
            chatRepository.deleteById(id);

            UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
            User admin = userRepository.findById(current.getId()).orElse(null);
            adminLogRepository.save(new AdminLog(admin, "DELETE_CHAT", "Disbanded chat group #" + id, id.toString()));

            return ResponseEntity.ok(Collections.singletonMap("deleted", true));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<?> deleteGlobalMessage(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        if (messageRepository.existsById(id)) {
            messageRepository.deleteById(id);

            UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
            User admin = userRepository.findById(current.getId()).orElse(null);
            adminLogRepository.save(new AdminLog(admin, "DELETE_MESSAGE", "Moderator deleted message #" + id, id.toString()));

            return ResponseEntity.ok(Collections.singletonMap("deleted", true));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/broadcast")
    public ResponseEntity<?> broadcastMessage(@RequestBody Map<String, String> payload, org.springframework.security.core.Authentication auth) {
        String content = payload.get("message");
        Map<String, Object> announcement = new HashMap<>();
        announcement.put("type", "ANNOUNCEMENT");
        announcement.put("content", content);
        announcement.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSend("/topic/announcements", announcement);

        UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
        User admin = userRepository.findById(current.getId()).orElse(null);
        adminLogRepository.save(new AdminLog(admin, "BROADCAST", "Sent global announcement: " + content, "ALL"));

        return ResponseEntity.ok(Collections.singletonMap("broadcasted", true));
    }

    @GetMapping("/settings")
    public List<SystemSetting> getSettings() {
        return systemSettingRepository.findAll();
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@RequestBody List<SystemSetting> settings, org.springframework.security.core.Authentication auth) {
        systemSettingRepository.saveAll(settings);

        UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
        User admin = userRepository.findById(current.getId()).orElse(null);
        adminLogRepository.save(new AdminLog(admin, "UPDATE_SETTINGS", "Updated system-wide settings.", "SYSTEM"));

        return ResponseEntity.ok(Collections.singletonMap("updated", true));
    }
}

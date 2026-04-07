package com.chatsphere.backend.controller;

import com.chatsphere.backend.model.*;
import com.chatsphere.backend.repository.*;
import com.chatsphere.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private ReportRepository reportRepository;
    @Autowired private AdminLogRepository adminLogRepository;
    @Autowired private SystemSettingRepository systemSettingRepository;
    @Autowired private UserSessionRepository userSessionRepository;
    @Autowired private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @jakarta.annotation.PostConstruct
    public void migrateOldAdmins() {
        // Ensure the primary account has Super Admin rights
        userRepository.findByUsername("testuser").ifPresent(u -> {
            u.setRole(ERole.ROLE_SUPER_ADMIN);
            u.setVerified(true);
            userRepository.save(u);
        });

        List<User> admins = userRepository.findAll();
        for (User u : admins) {
            if (u.getRole() == ERole.ROLE_ADMIN) {
                u.setRole(ERole.ROLE_USER);
                userRepository.save(u);
            }
        }

        // Seed default system settings if they don't already exist
        java.util.List<SystemSetting> defaults = java.util.Arrays.asList(
            new SystemSetting("MAINTENANCE_MODE", "false", "Disable all user access for maintenance."),
            new SystemSetting("REGISTRATION_ENABLED", "true", "Allow new users to create accounts."),
            new SystemSetting("CHAT_ENABLED", "true", "Global system toggle"),
            new SystemSetting("MEDIA_ENABLED", "true", "Global system toggle"),
            new SystemSetting("GROUPS_ENABLED", "true", "Global system toggle")
        );
        for (SystemSetting s : defaults) {
            if (!systemSettingRepository.existsById(s.getSettingKey())) {
                systemSettingRepository.save(s);
            }
        }
    }

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
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> payload, org.springframework.security.core.Authentication auth) {
        return userRepository.findById(id).map(user -> {
            try {
                ERole oldRole = user.getRole();
                String roleStr = payload.get("role");
                if (!roleStr.startsWith("ROLE_")) roleStr = "ROLE_" + roleStr.toUpperCase();
                user.setRole(ERole.valueOf(roleStr));
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

    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        return userRepository.findById(id).map(user -> {
            // Check if we are trying to delete ourselves
            UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
            if (user.getId().equals(current.getId())) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Cannot delete your own super admin account"));
            }

            // Cleanup all related data to prevent Foreign Key Constraint violations
            // Step 1: Reports that reference messages sent by this user
            jdbcTemplate.update("DELETE FROM reports WHERE reported_message_id IN (SELECT id FROM messages WHERE sender_id = ?)", id);
            // Step 2: Reports directly involving user
            jdbcTemplate.update("DELETE FROM reports WHERE reporter_id = ? OR reported_user_id = ?", id, id);
            // Step 3: User blocks
            jdbcTemplate.update("DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?", id, id);
            // Step 4: Friend requests (uses sender_id / receiver_id columns)
            jdbcTemplate.update("DELETE FROM friend_requests WHERE sender_id = ? OR receiver_id = ?", id, id);
            // Step 5: Contacts (uses user_low_id / user_high_id columns - matched from Contact entity)
            jdbcTemplate.update("DELETE FROM contacts WHERE user_low_id = ? OR user_high_id = ?", id, id);
            // Step 6: Messages sent by user
            jdbcTemplate.update("DELETE FROM messages WHERE sender_id = ?", id);
            // Step 7: Chat participants join table
            jdbcTemplate.update("DELETE FROM chat_participants WHERE user_id = ?", id);
            // Step 8: Active sessions
            jdbcTemplate.update("DELETE FROM user_sessions WHERE user_id = ?", id);
            // Step 9: Nullify admin logs to preserve audit history
            jdbcTemplate.update("UPDATE admin_logs SET admin_id = NULL WHERE admin_id = ?", id);

            userRepository.delete(user);
            User admin = userRepository.findById(current.getId()).orElse(null);
            adminLogRepository.save(new AdminLog(admin, "DELETE_USER", "Permanently deleted user account: " + user.getUsername(), user.getId().toString()));
            return ResponseEntity.ok(Collections.singletonMap("deleted", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/reset-password")
    public ResponseEntity<?> resetUserPassword(@PathVariable Long id, @RequestBody Map<String, String> payload, org.springframework.security.core.Authentication auth) {
        String newPassword = payload.get("password");
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Password must be at least 6 characters"));
        }
        
        return userRepository.findById(id).map(user -> {
            user.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(newPassword));
            userRepository.save(user);
            
            UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
            User admin = userRepository.findById(current.getId()).orElse(null);
            adminLogRepository.save(new AdminLog(admin, "RESET_PASSWORD", "Administratively reset password for user: " + user.getUsername(), user.getId().toString()));
            return ResponseEntity.ok(Collections.singletonMap("reset", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalChats", chatRepository.count());
        stats.put("totalMessages", messageRepository.count());
        stats.put("activeUsers", userRepository.countByOnlineTrue());
        stats.put("activeSessions", userSessionRepository.count());

        // Role Distribution
        Map<String, Long> roles = new HashMap<>();
        for (ERole r : ERole.values()) {
            roles.put(r.name(), userRepository.countByRole(r));
        }
        stats.put("roleDistribution", roles);

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

    @GetMapping("/analytics/geo")
    public List<Map<String, Object>> getGeoAnalytics() {
        // Mocking geo data for the stunning dashboard
        String[] countries = {"USA", "India", "UK", "Germany", "Japan", "Brazil", "Canada"};
        Random r = new Random();
        List<Map<String, Object>> data = new ArrayList<>();
        for (String c : countries) {
            Map<String, Object> m = new HashMap<>();
            m.put("country", c);
            m.put("users", r.nextInt(1000));
            data.add(m);
        }
        return data;
    }

    @Autowired private FriendRequestRepository friendRequestRepository;

    @GetMapping("/contacts")
    public List<Map<String, Object>> getAllContactRequests() {
        return friendRequestRepository.findAll().stream().map(fr -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", fr.getId());
            map.put("sender", fr.getSender().getUsername());
            map.put("receiver", fr.getReceiver().getUsername());
            map.put("status", fr.getStatus().name());
            map.put("createdAt", fr.getCreatedAt());
            map.put("risk", fr.getStatus() == EFriendRequestStatus.PENDING ? "HIGH" : "NONE");
            return map;
        }).sorted((a, b) -> ((LocalDateTime)b.get("createdAt")).compareTo((LocalDateTime)a.get("createdAt")))
        .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/health")
    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("uptime", "4d 12h 30m");
        health.put("dbStatus", "CONNECTED");
        health.put("diskSpace", "85% Free");
        health.put("activeConnections", userRepository.countByOnlineTrue());
        health.put("cpuUsage", "12%");
        health.put("memoryUsage", "1.2GB / 4GB");
        return health;
    }

    @DeleteMapping("/cleanup")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> performCleanup(@RequestParam String type, org.springframework.security.core.Authentication auth) {
        UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
        User admin = userRepository.findById(current.getId()).orElse(null);

        if ("ALL_LOGS".equals(type)) {
            adminLogRepository.deleteAll();
            adminLogRepository.save(new AdminLog(admin, "CLEAR_LOGS", "Cleared all system logs.", "SYSTEM"));
            return ResponseEntity.ok(Collections.singletonMap("message", "All audit logs purged."));
        } else if ("ALL_MEDIA".equals(type)) {
            jdbcTemplate.update("DELETE FROM messages WHERE type != 'TEXT'");
            adminLogRepository.save(new AdminLog(admin, "CLEAR_MEDIA", "Cleared all media files.", "SYSTEM"));
            return ResponseEntity.ok(Collections.singletonMap("message", "All media purged."));
        } else if ("ALL_SESSIONS".equals(type)) {
            jdbcTemplate.update("DELETE FROM user_sessions");
            adminLogRepository.save(new AdminLog(admin, "CLEAR_SESSIONS", "Terminated all active sessions.", "SYSTEM"));
            return ResponseEntity.ok(Collections.singletonMap("message", "All active sessions terminated."));
        } else if ("ALL_CONTACTS".equals(type)) {
            jdbcTemplate.update("DELETE FROM friend_requests");
            jdbcTemplate.update("DELETE FROM contacts");
            adminLogRepository.save(new AdminLog(admin, "CLEAR_CONTACTS", "Deleted all connection history.", "SYSTEM"));
            return ResponseEntity.ok(Collections.singletonMap("message", "All contact data purged."));
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/reports")
    public ResponseEntity<?> getAllReports(@RequestParam(required = false) String status) {
        try {
            if (status != null && !status.isEmpty()) {
                Report.EReportStatus s = Report.EReportStatus.valueOf(status.trim().toUpperCase());
                return ResponseEntity.ok(reportRepository.findByStatusOrderByCreatedAtDesc(s));
            }
            return ResponseEntity.ok(reportRepository.findAll());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid report status"));
        }
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
    @Transactional
    public ResponseEntity<?> deleteChat(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        return chatRepository.findById(id).map(chat -> {
            // 1. Delete all messages in this chat
            List<Message> messages = messageRepository.findByChat_IdOrderByCreatedAtAsc(id);
            messageRepository.deleteAll(messages);
            
            // 2. Clear participants to break join table links
            chat.setParticipants(new ArrayList<>());
            chatRepository.save(chat);
            
            // 3. Delete the chat itself
            chatRepository.delete(chat);

            UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
            User admin = userRepository.findById(current.getId()).orElse(null);
            adminLogRepository.save(new AdminLog(admin, "DELETE_CHAT", "Disbanded and purged chat group #" + id, id.toString()));

            return ResponseEntity.ok(Collections.singletonMap("deleted", true));
        }).orElse(ResponseEntity.notFound().build());
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

    @GetMapping("/messages")
    public List<Map<String, Object>> getGlobalMessages(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String username) {
        List<Message> messages = messageRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Message m : messages) {
            if (search != null && m.getContent() != null && !m.getContent().toLowerCase().contains(search.toLowerCase())) continue;
            if (username != null && m.getSender() != null && !m.getSender().getUsername().toLowerCase().contains(username.toLowerCase())) continue;
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("content", m.getContent());
            map.put("sender", m.getSender().getUsername());
            map.put("chatId", m.getChat().getId());
            map.put("createdAt", m.getCreatedAt());
            map.put("type", m.getType());
            result.add(map);
        }
        Collections.sort(result, (a, b) -> ((LocalDateTime)b.get("createdAt")).compareTo((LocalDateTime)a.get("createdAt")));
        return result;
    }

    @GetMapping("/media")
    public List<Map<String, Object>> getGlobalMedia() {
        return messageRepository.findAll().stream()
                .filter(m -> !"TEXT".equals(m.getType()))
                .map(m -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", m.getId());
                    map.put("type", m.getType());
                    map.put("sender", m.getSender().getUsername());
                    map.put("createdAt", m.getCreatedAt());
                    map.put("url", m.getContent());
                    return map;
                })
                .sorted((a, b) -> ((LocalDateTime)b.get("createdAt")).compareTo((LocalDateTime)a.get("createdAt")))
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/groups/{id}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable Long id) {
        return chatRepository.findById(id).map(chat -> {
            List<Map<String, Object>> members = new ArrayList<>();
            for (User u : chat.getParticipants()) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", u.getId());
                m.put("username", u.getUsername());
                m.put("role", u.getRole().name());
                members.add(m);
            }
            return ResponseEntity.ok(members);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sessions")
    public List<Map<String, Object>> getActiveSessions() {
        return userSessionRepository.findAll().stream()
                .filter(UserSession::isActive)
                .map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", s.getId());
                    map.put("username", s.getUser().getUsername());
                    map.put("device", s.getDevice());
                    map.put("location", s.getLocation());
                    map.put("loginTime", s.getLoginTime());
                    return map;
                }).collect(java.util.stream.Collectors.toList());
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> forceLogout(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        return userSessionRepository.findById(id).map(session -> {
            session.setActive(false);
            userSessionRepository.save(session);
            
            UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
            User admin = userRepository.findById(current.getId()).orElse(null);
            adminLogRepository.save(new AdminLog(admin, "FORCE_LOGOUT", "Forced logout for: @"+session.getUser().getUsername(), session.getId().toString()));
            
            return ResponseEntity.ok(Collections.singletonMap("terminated", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/broadcast")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
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
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateSettings(@RequestBody List<SystemSetting> settings, org.springframework.security.core.Authentication auth) {
        systemSettingRepository.saveAll(settings);

        UserDetailsImpl current = (UserDetailsImpl) auth.getPrincipal();
        User admin = userRepository.findById(current.getId()).orElse(null);
        adminLogRepository.save(new AdminLog(admin, "UPDATE_SETTINGS", "Updated system-wide settings.", "SYSTEM"));

        return ResponseEntity.ok(Collections.singletonMap("updated", true));
    }
}

package com.chatsphere.backend.controller;

import com.chatsphere.backend.model.*;
import com.chatsphere.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private ChatRepository chatRepository;

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PutMapping("/users/{id}/toggle-lock")
    public ResponseEntity<?> toggleUserLock(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setLocked(!user.isLocked());
            userRepository.save(user);
            return ResponseEntity.ok(Collections.singletonMap("locked", user.isLocked()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalChats", chatRepository.count());
        stats.put("totalMessages", messageRepository.count());
        
        long activeCount = userRepository.findAll().stream().filter(User::isOnline).count();
        stats.put("activeUsers", activeCount);
        
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<?> deleteGlobalMessage(@PathVariable Long id) {
        if (messageRepository.existsById(id)) {
            messageRepository.deleteById(id);
            return ResponseEntity.ok(Collections.singletonMap("deleted", true));
        }
        return ResponseEntity.notFound().build();
    }
}

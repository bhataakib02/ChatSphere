package com.chatsphere.backend.controller;

import com.chatsphere.backend.model.User;
import com.chatsphere.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    /**
     * Admin-only full user list (for moderation). Regular clients use /api/contacts and /api/contacts/search.
     */
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public List<User> getAllUsersForAdmin() {
        return userRepository.findAll();
    }

    @PutMapping("/{id}")
    @PreAuthorize("#id == authentication.principal.id or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<User> updateProfile(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {
            if (userDetails.getUsername() != null && !userDetails.getUsername().isBlank()) {
                user.setUsername(userDetails.getUsername());
            }
            user.setBio(userDetails.getBio());
            if (userDetails.getProfilePicture() != null) {
                user.setProfilePicture(userDetails.getProfilePicture());
            }
            if (userDetails.getProfilePhoto() != null) {
                user.setProfilePhoto(userDetails.getProfilePhoto());
            }
            if (userDetails.getPublicKey() != null) {
                user.setPublicKey(userDetails.getPublicKey());
            }
            User updated = userRepository.save(user);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
}

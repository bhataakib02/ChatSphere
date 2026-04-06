package com.chatsphere.backend.controller;

import com.chatsphere.backend.model.Chat;
import com.chatsphere.backend.model.FriendRequest;
import com.chatsphere.backend.model.User;
import com.chatsphere.backend.security.UserDetailsImpl;
import com.chatsphere.backend.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    @Autowired
    private ContactService contactService;

    @GetMapping
    public List<User> myContacts(Authentication authentication) {
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        return contactService.listContacts(u.getId());
    }

    @GetMapping("/search")
    public List<User> search(@RequestParam("q") String q, Authentication authentication) {
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        return contactService.searchForAdding(q, u.getId());
    }

    @PostMapping("/requests")
    public ResponseEntity<?> sendRequest(@RequestBody Map<String, Object> body, Authentication authentication) {
        Object raw = body.get("receiverId");
        Long receiverId = raw instanceof Number ? ((Number) raw).longValue() : null;
        if (receiverId == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "receiverId required"));
        }
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        FriendRequest fr = contactService.sendRequest(u.getId(), receiverId);
        return ResponseEntity.ok(fr);
    }

    @GetMapping("/requests/incoming")
    public List<FriendRequest> incoming(Authentication authentication) {
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        return contactService.incomingPending(u.getId());
    }

    @GetMapping("/requests/outgoing")
    public List<FriendRequest> outgoing(Authentication authentication) {
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        return contactService.outgoingPending(u.getId());
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<Chat> accept(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        Chat chat = contactService.acceptRequest(id, u.getId());
        return ResponseEntity.ok(chat);
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        contactService.rejectRequest(id, u.getId());
        return ResponseEntity.ok(Collections.singletonMap("ok", true));
    }

    @DeleteMapping("/requests/{id}")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        contactService.cancelRequest(id, u.getId());
        return ResponseEntity.ok(Collections.singletonMap("ok", true));
    }

    @PostMapping("/block/{userId}")
    public ResponseEntity<?> block(@PathVariable Long userId, Authentication authentication) {
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        contactService.blockUser(u.getId(), userId);
        return ResponseEntity.ok(Collections.singletonMap("ok", true));
    }

    @DeleteMapping("/block/{userId}")
    public ResponseEntity<?> unblock(@PathVariable Long userId, Authentication authentication) {
        UserDetailsImpl u = (UserDetailsImpl) authentication.getPrincipal();
        contactService.unblockUser(u.getId(), userId);
        return ResponseEntity.ok(Collections.singletonMap("ok", true));
    }
}

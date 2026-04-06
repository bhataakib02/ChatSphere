package com.chatsphere.backend.controller;

import com.chatsphere.backend.model.Chat;
import com.chatsphere.backend.model.User;
import com.chatsphere.backend.repository.ChatRepository;
import com.chatsphere.backend.repository.UserRepository;
import com.chatsphere.backend.security.UserDetailsImpl;
import com.chatsphere.backend.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chats")
public class ChatController {
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ContactService contactService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public List<Chat> getUserChats(@PathVariable Long userId) {
        return contactService.visibleChatsForUser(userId);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createChat(@RequestBody CreateChatRequest request, Authentication authentication) {
        UserDetailsImpl current = (UserDetailsImpl) authentication.getPrincipal();
        if (request.getParticipantIds() == null || request.getParticipantIds().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "participantIds required"));
        }
        Set<Long> ids = new HashSet<>(request.getParticipantIds());
        ids.add(current.getId());
        List<User> participants = userRepository.findAllById(ids);
        if (participants.size() != ids.size()) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "Unknown user id in participants"));
        }

        List<Long> others = ids.stream().filter(id -> !id.equals(current.getId())).collect(Collectors.toList());
        contactService.assertAllContactsWith(current.getId(), others);

        if (!request.getIsGroup() && ids.size() != 2) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", "Direct chat requires exactly two people"));
        }

        Chat chat = new Chat();
        chat.setName(request.getName());
        chat.setIsGroup(request.getIsGroup());
        chat.setCreatedAt(LocalDateTime.now());
        chat.setParticipants(new ArrayList<>(participants));
        chatRepository.save(chat);
        return ResponseEntity.ok(chat);
    }
}

class CreateChatRequest {
    private String name;
    private boolean isGroup;
    private Set<Long> participantIds;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean getIsGroup() {
        return isGroup;
    }

    public void setIsGroup(boolean isGroup) {
        this.isGroup = isGroup;
    }

    public Set<Long> getParticipantIds() {
        return participantIds;
    }

    public void setParticipantIds(Set<Long> participantIds) {
        this.participantIds = participantIds;
    }
}

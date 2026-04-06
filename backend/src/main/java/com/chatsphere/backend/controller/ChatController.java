package com.chatsphere.backend.controller;

import com.chatsphere.backend.model.Chat;
import com.chatsphere.backend.model.User;
import com.chatsphere.backend.repository.ChatRepository;
import com.chatsphere.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/chats")
public class ChatController {
    @Autowired private ChatRepository chatRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping("/user/{userId}")
    public List<Chat> getUserChats(@PathVariable Long userId) {
        return chatRepository.findChatsByUserId(userId);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createChat(@RequestBody CreateChatRequest request) {
        Chat chat = new Chat();
        chat.setName(request.getName());
        chat.setIsGroup(request.getIsGroup());
        chat.setCreatedAt(LocalDateTime.now());
        chat.setParticipants(new ArrayList<>(userRepository.findAllById(request.getParticipantIds())));
        chatRepository.save(chat);
        return ResponseEntity.ok(chat);
    }
}

class CreateChatRequest {
    private String name;
    private boolean isGroup;
    private Set<Long> participantIds;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public boolean getIsGroup() { return isGroup; }
    public void setIsGroup(boolean isGroup) { this.isGroup = isGroup; }
    public Set<Long> getParticipantIds() { return participantIds; }
    public void setParticipantIds(Set<Long> participantIds) { this.participantIds = participantIds; }
}

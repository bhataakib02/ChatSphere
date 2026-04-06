package com.chatsphere.backend.controller;

import com.chatsphere.backend.model.Chat;
import com.chatsphere.backend.model.Message;
import com.chatsphere.backend.repository.ChatRepository;
import com.chatsphere.backend.repository.MessageRepository;
import com.chatsphere.backend.security.UserDetailsImpl;
import com.chatsphere.backend.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private static final Set<String> ALLOWED_UPLOAD_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "pdf", "txt", "mp3", "wav", "mp4", "webm"
    );

    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private ContactService contactService;

    @GetMapping("/chat/{chatId}")
    public List<Message> getChatMessages(@PathVariable Long chatId, Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
        if (!chatRepository.existsByIdAndParticipants_Id(chatId, user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant in this chat");
        }
        Chat chat = chatRepository.findById(chatId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!contactService.canExchangeMessagesInChat(user.getId(), chat)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Messaging is only allowed with accepted contacts");
        }
        return messageRepository.findByChat_IdOrderByCreatedAtAsc(chatId);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Empty file"));
        }
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Missing filename"));
        }
        String lower = original.toLowerCase(Locale.ROOT);
        int dot = lower.lastIndexOf('.');
        String ext = dot >= 0 && dot < lower.length() - 1 ? lower.substring(dot + 1) : "";
        if (ext.isEmpty() || !ALLOWED_UPLOAD_EXTENSIONS.contains(ext)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "File type not allowed"));
        }
        String safeName = UUID.randomUUID() + "." + ext;
        try {
            Path path = Paths.get("uploads", safeName);
            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());
            return ResponseEntity.ok(Collections.singletonMap("fileUrl", "/uploads/" + safeName));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("error", "Upload failed"));
        }
    }
}

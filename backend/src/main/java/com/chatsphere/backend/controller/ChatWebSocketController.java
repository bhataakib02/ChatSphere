package com.chatsphere.backend.controller;

import com.chatsphere.backend.model.Chat;
import com.chatsphere.backend.model.Message;
import com.chatsphere.backend.model.User;
import com.chatsphere.backend.repository.ChatRepository;
import com.chatsphere.backend.repository.MessageRepository;
import com.chatsphere.backend.repository.UserRepository;
import com.chatsphere.backend.security.UserDetailsImpl;
import com.chatsphere.backend.service.ContactService;
import com.chatsphere.backend.websocket.StompAuthChannelInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
public class ChatWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ContactService contactService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessagePayload payload, Principal principal) {
        UserDetailsImpl user = StompAuthChannelInterceptor.requireUser(principal);
        if (payload.getChatId() == null) {
            return;
        }
        if (!chatRepository.existsByIdAndParticipants_Id(payload.getChatId(), user.getId())) {
            return;
        }
        Chat chat = chatRepository.findById(payload.getChatId()).orElse(null);
        User sender = userRepository.findById(user.getId()).orElse(null);
        if (chat == null || sender == null) {
            return;
        }
        if (!contactService.canExchangeMessagesInChat(user.getId(), chat)) {
            return;
        }

        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(payload.getContent());
        message.setType(payload.getType() != null ? payload.getType() : "TEXT");
        message.setFileUrl(payload.getFileUrl());
        message.setCreatedAt(LocalDateTime.now());
        message.setEncrypted(payload.isEncrypted());
        message.setNonce(payload.getNonce());

        if (payload.getParentMessageId() != null) {
            messageRepository.findById(payload.getParentMessageId()).ifPresent(message::setParentMessage);
        }

        Message savedMessage = messageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), savedMessage);
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingPayload payload, Principal principal) {
        UserDetailsImpl user = StompAuthChannelInterceptor.requireUser(principal);
        if (payload.getChatId() == null || !chatRepository.existsByIdAndParticipants_Id(payload.getChatId(), user.getId())) {
            return;
        }
        Chat chat = chatRepository.findById(payload.getChatId()).orElse(null);
        if (chat == null || !contactService.canExchangeMessagesInChat(user.getId(), chat)) {
            return;
        }
        if (payload.getUsername() == null || !payload.getUsername().equals(user.getUsername())) {
            payload.setUsername(user.getUsername());
        }
        messagingTemplate.convertAndSend("/topic/chat/" + payload.getChatId() + "/typing", payload);
    }

    @MessageMapping("/chat.markRead")
    public void markRead(@Payload MarkReadPayload payload, Principal principal) {
        UserDetailsImpl user = StompAuthChannelInterceptor.requireUser(principal);
        if (payload.getChatId() == null || payload.getReaderId() == null) {
            return;
        }
        if (!payload.getReaderId().equals(user.getId())) {
            return;
        }
        if (!chatRepository.existsByIdAndParticipants_Id(payload.getChatId(), user.getId())) {
            return;
        }
        Chat chat = chatRepository.findById(payload.getChatId()).orElse(null);
        if (chat == null || !contactService.canExchangeMessagesInChat(user.getId(), chat)) {
            return;
        }
        messageRepository.markMessagesAsRead(payload.getChatId(), payload.getReaderId());
        messagingTemplate.convertAndSend("/topic/chat/" + payload.getChatId() + "/read", payload);
    }

    @MessageMapping("/chat.react")
    public void reactToMessage(@Payload ReactPayload payload, Principal principal) {
        UserDetailsImpl user = StompAuthChannelInterceptor.requireUser(principal);
        if (payload.getMessageId() == null || payload.getChatId() == null || payload.getUserId() == null) {
            return;
        }
        if (!payload.getUserId().equals(user.getId())) {
            return;
        }
        if (!chatRepository.existsByIdAndParticipants_Id(payload.getChatId(), user.getId())) {
            return;
        }
        Chat chat = chatRepository.findById(payload.getChatId()).orElse(null);
        if (chat == null || !contactService.canExchangeMessagesInChat(user.getId(), chat)) {
            return;
        }
        messageRepository.findById(payload.getMessageId()).ifPresent(msg -> {
            if (payload.getReaction() == null || payload.getReaction().isEmpty()) {
                msg.getReactions().remove(payload.getUserId());
            } else {
                msg.getReactions().put(payload.getUserId(), payload.getReaction());
            }
            messageRepository.save(msg);
            messagingTemplate.convertAndSend("/topic/chat/" + payload.getChatId() + "/reaction", payload);
        });
    }
}

class ChatMessagePayload {
    private Long chatId;
    private Long senderId;
    private String content;
    private String type;
    private String fileUrl;
    private Long parentMessageId;
    private boolean encrypted;
    private String nonce;

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public Long getParentMessageId() {
        return parentMessageId;
    }

    public void setParentMessageId(Long parentMessageId) {
        this.parentMessageId = parentMessageId;
    }

    public boolean isEncrypted() {
        return encrypted;
    }

    public void setEncrypted(boolean encrypted) {
        this.encrypted = encrypted;
    }

    public String getNonce() {
        return nonce;
    }

    public void setNonce(String nonce) {
        this.nonce = nonce;
    }
}

class TypingPayload {
    private Long chatId;
    private String username;
    private boolean typing;

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public boolean isTyping() {
        return typing;
    }

    public void setTyping(boolean typing) {
        this.typing = typing;
    }
}

class MarkReadPayload {
    private Long chatId;
    private Long readerId;

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public Long getReaderId() {
        return readerId;
    }

    public void setReaderId(Long readerId) {
        this.readerId = readerId;
    }
}

class ReactPayload {
    private Long messageId;
    private Long userId;
    private String reaction;
    private Long chatId;

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getReaction() {
        return reaction;
    }

    public void setReaction(String reaction) {
        this.reaction = reaction;
    }

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }
}

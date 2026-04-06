package com.chatsphere.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User sender;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String type;
    private String fileUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_message_id")
    private Message parentMessage;

    @Enumerated(EnumType.STRING)
    private EMessageStatus status = EMessageStatus.SENT;

    private Boolean encrypted = false;
    private String nonce; // initialization vector for E2EE

    @ElementCollection
    @CollectionTable(name = "message_reactions", joinColumns = @JoinColumn(name = "message_id"))
    @MapKeyColumn(name = "user_id")
    @Column(name = "reaction")
    private Map<Long, String> reactions = new HashMap<>();

    private LocalDateTime createdAt;

    public Message() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Chat getChat() { return chat; }
    public void setChat(Chat chat) { this.chat = chat; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public Message getParentMessage() { return parentMessage; }
    public void setParentMessage(Message parentMessage) { this.parentMessage = parentMessage; }
    public EMessageStatus getStatus() { return status; }
    public void setStatus(EMessageStatus status) { this.status = status; }

    public Map<Long, String> getReactions() { return reactions; }
    public void setReactions(Map<Long, String> reactions) { this.reactions = reactions; }

    public Boolean isEncrypted() { return encrypted; }
    public void setEncrypted(Boolean encrypted) { this.encrypted = encrypted; }
    public String getNonce() { return nonce; }
    public void setNonce(String nonce) { this.nonce = nonce; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static MessageBuilder builder() { return new MessageBuilder(); }

    public static class MessageBuilder {
        private Chat chat;
        private User sender;
        private String content;
        private String type;
        private String fileUrl;
        private EMessageStatus status;
        private LocalDateTime createdAt;
        private Message parentMessage;

        public MessageBuilder chat(Chat v) { this.chat = v; return this; }
        public MessageBuilder sender(User v) { this.sender = v; return this; }
        public MessageBuilder content(String v) { this.content = v; return this; }
        public MessageBuilder type(String v) { this.type = v; return this; }
        public MessageBuilder fileUrl(String v) { this.fileUrl = v; return this; }
        public MessageBuilder status(EMessageStatus v) { this.status = v; return this; }
        public MessageBuilder createdAt(LocalDateTime v) { this.createdAt = v; return this; }
        public MessageBuilder parentMessage(Message v) { this.parentMessage = v; return this; }

        public Message build() {
            Message m = new Message();
            m.setChat(chat);
            m.setSender(sender);
            m.setContent(content);
            m.setType(type);
            m.setFileUrl(fileUrl);
            m.setStatus(status);
            m.setCreatedAt(createdAt);
            m.setParentMessage(parentMessage);
            return m;
        }
    }
}

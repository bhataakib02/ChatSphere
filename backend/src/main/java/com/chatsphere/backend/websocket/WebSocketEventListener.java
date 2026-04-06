package com.chatsphere.backend.websocket;

import com.chatsphere.backend.model.User;
import com.chatsphere.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Component
public class WebSocketEventListener {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String username = headers.getUser() != null ? headers.getUser().getName() : null;
        
        if (username != null) {
            updateUserStatus(username, true);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String username = headers.getUser() != null ? headers.getUser().getName() : null;

        if (username != null) {
            updateUserStatus(username, false);
        }
    }

    private void updateUserStatus(String username, boolean online) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setOnline(online);
            if (!online) {
                user.setLastSeen(java.time.LocalDateTime.now());
            }
            userRepository.save(user);

            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("userId", user.getId());
            statusUpdate.put("username", username);
            statusUpdate.put("online", online);
            statusUpdate.put("lastSeen", user.getLastSeen());

            messagingTemplate.convertAndSend("/topic/users/status", statusUpdate);
        });
    }
}

package com.chatsphere.backend.websocket;

import com.chatsphere.backend.security.JwtUtils;
import com.chatsphere.backend.security.UserDetailsImpl;
import com.chatsphere.backend.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtUtils jwtUtils;
    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new SecurityException("Missing or invalid STOMP Authorization header");
        }
        String token = authHeader.substring(7).trim();
        if (!jwtUtils.validateJwtToken(token)) {
            throw new SecurityException("Invalid JWT");
        }
        String username = jwtUtils.getUserNameFromJwtToken(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        accessor.setUser(authentication);
        return message;
    }

    public static UserDetailsImpl requireUser(java.security.Principal principal) {
        if (!(principal instanceof UsernamePasswordAuthenticationToken auth)) {
            throw new SecurityException("Unauthenticated STOMP session");
        }
        if (!(auth.getPrincipal() instanceof UserDetailsImpl user)) {
            throw new SecurityException("Unexpected principal type");
        }
        return user;
    }
}

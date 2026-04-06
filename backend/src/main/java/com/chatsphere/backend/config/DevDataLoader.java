package com.chatsphere.backend.config;

import com.chatsphere.backend.model.ERole;
import com.chatsphere.backend.model.User;
import com.chatsphere.backend.repository.UserRepository;
import com.chatsphere.backend.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevDataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ContactService contactService;

    @Override
    public void run(String... args) {
        seedIfMissing("admin", "admin@chatsphere.local", ERole.ROLE_SUPER_ADMIN);
        seedIfMissing("user1", "user1@chatsphere.local", ERole.ROLE_USER);
        seedIfMissing("user2", "user2@chatsphere.local", ERole.ROLE_USER);

        userRepository.findByUsername("user1").ifPresent(u1 ->
                userRepository.findByUsername("user2").ifPresent(u2 ->
                        contactService.ensureContactPairAndChat(u1.getId(), u2.getId())));
        userRepository.findByUsername("admin").ifPresent(a ->
                userRepository.findByUsername("user1").ifPresent(u1 ->
                        contactService.ensureContactPairAndChat(a.getId(), u1.getId())));
    }

    private void seedIfMissing(String username, String email, ERole role) {
        if (userRepository.existsByUsername(username)) {
            return;
        }
        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode("password"))
                .role(role)
                .online(false)
                .build();
        userRepository.save(user);
    }
}

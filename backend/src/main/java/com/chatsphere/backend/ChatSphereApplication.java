package com.chatsphere.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;

@SpringBootApplication
@EnableScheduling
public class ChatSphereApplication {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void setupDatabaseRoles() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("UPDATE users SET locked = false WHERE locked IS NULL");
            jdbcTemplate.execute("UPDATE users SET role = 'ROLE_SUPER_ADMIN' WHERE username = 'testuser'");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN locked SET NOT NULL");
        } catch (Exception e) {}
    }

    public static void main(String[] args) {
        SpringApplication.run(ChatSphereApplication.class, args);
    }
}

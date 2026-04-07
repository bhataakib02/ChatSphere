package com.chatsphere.backend.repository;

import com.chatsphere.backend.model.UserSession;
import com.chatsphere.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserAndIsActiveTrue(User user);
    Optional<UserSession> findByToken(String token);
}

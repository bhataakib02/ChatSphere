package com.chatsphere.backend.repository;

import com.chatsphere.backend.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    long countByOnlineTrue();
    long countByRole(com.chatsphere.backend.model.ERole role);

    @Query("SELECT u FROM User u WHERE u.id <> :excludeId AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<User> searchByUsernameOrEmailExcluding(@Param("q") String q, @Param("excludeId") Long excludeId, Pageable pageable);
}

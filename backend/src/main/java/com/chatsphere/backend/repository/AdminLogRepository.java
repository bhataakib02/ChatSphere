package com.chatsphere.backend.repository;

import com.chatsphere.backend.model.AdminLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {
    List<AdminLog> findAllByOrderByCreatedAtDesc();
}

package com.chatsphere.backend.repository;

import com.chatsphere.backend.model.EFriendRequestStatus;
import com.chatsphere.backend.model.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    List<FriendRequest> findByReceiverIdAndStatusOrderByCreatedAtDesc(Long receiverId, EFriendRequestStatus status);

    List<FriendRequest> findBySenderIdAndStatusOrderByCreatedAtDesc(Long senderId, EFriendRequestStatus status);

    Optional<FriendRequest> findBySenderIdAndReceiverIdAndStatus(Long senderId, Long receiverId, EFriendRequestStatus status);

    boolean existsBySenderIdAndReceiverIdAndStatus(Long senderId, Long receiverId, EFriendRequestStatus status);

    boolean existsByReceiverIdAndSenderIdAndStatus(Long receiverId, Long senderId, EFriendRequestStatus status);
}

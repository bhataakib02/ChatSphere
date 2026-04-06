package com.chatsphere.backend.service;

import com.chatsphere.backend.model.*;
import com.chatsphere.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ContactService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ContactRepository contactRepository;
    @Autowired
    private FriendRequestRepository friendRequestRepository;
    @Autowired
    private UserBlockRepository userBlockRepository;
    @Autowired
    private ChatRepository chatRepository;

    @Transactional(readOnly = true)
    public List<User> listContacts(Long userId) {
        List<Contact> rows = contactRepository.findAllInvolvingUser(userId);
        List<User> out = new ArrayList<>();
        for (Contact c : rows) {
            User a = c.getUserLow();
            User b = c.getUserHigh();
            if (a.getId().equals(userId)) {
                out.add(b);
            } else {
                out.add(a);
            }
        }
        out.sort(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER));
        return out;
    }

    @Transactional(readOnly = true)
    public List<User> searchForAdding(String query, Long currentUserId) {
        String q = query == null ? "" : query.trim();
        if (q.length() < 2) {
            return List.of();
        }
        List<User> hits = userRepository.searchByUsernameOrEmailExcluding(q, currentUserId, PageRequest.of(0, 20));
        Set<Long> contactIds = listContacts(currentUserId).stream().map(User::getId).collect(Collectors.toSet());

        return hits.stream()
                .filter(u -> !contactIds.contains(u.getId()))
                .filter(u -> !userBlockRepository.existsBlockBetween(currentUserId, u.getId()))
                .filter(u -> !friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(currentUserId, u.getId(), EFriendRequestStatus.PENDING))
                .filter(u -> !friendRequestRepository.existsByReceiverIdAndSenderIdAndStatus(currentUserId, u.getId(), EFriendRequestStatus.PENDING))
                .collect(Collectors.toList());
    }

    @Transactional
    public FriendRequest sendRequest(Long senderId, Long receiverId) {
        if (senderId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot request yourself");
        }
        User sender = userRepository.findById(senderId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User receiver = userRepository.findById(receiverId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (userBlockRepository.existsBlockBetween(senderId, receiverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot send request");
        }
        if (contactRepository.areContacts(senderId, receiverId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already contacts");
        }
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(senderId, receiverId, EFriendRequestStatus.PENDING)
                || friendRequestRepository.existsByReceiverIdAndSenderIdAndStatus(senderId, receiverId, EFriendRequestStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already pending");
        }

        FriendRequest fr = new FriendRequest();
        fr.setSender(sender);
        fr.setReceiver(receiver);
        fr.setStatus(EFriendRequestStatus.PENDING);
        fr.setCreatedAt(LocalDateTime.now());
        return friendRequestRepository.save(fr);
    }

    public List<FriendRequest> incomingPending(Long receiverId) {
        return friendRequestRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(receiverId, EFriendRequestStatus.PENDING);
    }

    public List<FriendRequest> outgoingPending(Long senderId) {
        return friendRequestRepository.findBySenderIdAndStatusOrderByCreatedAtDesc(senderId, EFriendRequestStatus.PENDING);
    }

    @Transactional
    public Chat acceptRequest(Long requestId, Long currentUserId) {
        FriendRequest fr = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (fr.getStatus() != EFriendRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }
        if (!fr.getReceiver().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your request to accept");
        }

        Long a = fr.getSender().getId();
        Long b = fr.getReceiver().getId();
        fr.setStatus(EFriendRequestStatus.ACCEPTED);
        friendRequestRepository.save(fr);

        long[] o = Contact.orderedIds(a, b);
        if (contactRepository.findByOrderedPair(o[0], o[1]).isEmpty()) {
            User low = userRepository.findById(o[0]).orElseThrow();
            User high = userRepository.findById(o[1]).orElseThrow();
            Contact c = new Contact();
            c.setUserLow(low);
            c.setUserHigh(high);
            c.setCreatedAt(LocalDateTime.now());
            contactRepository.save(c);
        }

        return findOrCreateDirectChat(a, b);
    }

    @Transactional
    public void rejectRequest(Long requestId, Long currentUserId) {
        FriendRequest fr = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (fr.getStatus() != EFriendRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }
        if (!fr.getReceiver().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your request to reject");
        }
        fr.setStatus(EFriendRequestStatus.REJECTED);
        friendRequestRepository.save(fr);
    }

    @Transactional
    public void cancelRequest(Long requestId, Long currentUserId) {
        FriendRequest fr = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (fr.getStatus() != EFriendRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }
        if (!fr.getSender().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only sender can cancel");
        }
        friendRequestRepository.delete(fr);
    }

    @Transactional
    public void blockUser(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid");
        }
        User blocker = userRepository.findById(blockerId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User blocked = userRepository.findById(blockedId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            return;
        }
        friendRequestRepository.findBySenderIdAndReceiverIdAndStatus(blockerId, blockedId, EFriendRequestStatus.PENDING).ifPresent(friendRequestRepository::delete);
        friendRequestRepository.findBySenderIdAndReceiverIdAndStatus(blockedId, blockerId, EFriendRequestStatus.PENDING).ifPresent(friendRequestRepository::delete);

        UserBlock ub = new UserBlock();
        ub.setBlocker(blocker);
        ub.setBlocked(blocked);
        ub.setCreatedAt(LocalDateTime.now());
        userBlockRepository.save(ub);
    }

    @Transactional
    public void unblockUser(Long blockerId, Long blockedId) {
        userBlockRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    public boolean areContacts(Long a, Long b) {
        return contactRepository.areContacts(a, b);
    }

    public void assertAllContactsWith(Long userId, Collection<Long> otherUserIds) {
        for (Long oid : otherUserIds) {
            if (!userId.equals(oid) && !contactRepository.areContacts(userId, oid)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only chat with accepted contacts");
            }
        }
    }

    public List<Chat> visibleChatsForUser(Long userId) {
        List<Chat> all = chatRepository.findChatsByUserId(userId);
        List<Chat> out = new ArrayList<>();
        for (Chat c : all) {
            if (c.getIsGroup()) {
                out.add(c);
                continue;
            }
            if (c.getParticipants() == null || c.getParticipants().size() != 2) {
                continue;
            }
            Long other = c.getParticipants().stream()
                    .map(User::getId)
                    .filter(id -> !id.equals(userId))
                    .findFirst()
                    .orElse(null);
            if (other != null && contactRepository.areContacts(userId, other)) {
                out.add(c);
            }
        }
        return out;
    }

    private Chat findOrCreateDirectChat(Long userA, Long userB) {
        List<Chat> aChats = chatRepository.findChatsByUserId(userA);
        for (Chat c : aChats) {
            if (c.getIsGroup() || c.getParticipants() == null || c.getParticipants().size() != 2) {
                continue;
            }
            Set<Long> ids = c.getParticipants().stream().map(User::getId).collect(Collectors.toSet());
            if (ids.contains(userA) && ids.contains(userB)) {
                return c;
            }
        }
        User ua = userRepository.findById(userA).orElseThrow();
        User ub = userRepository.findById(userB).orElseThrow();
        Chat chat = new Chat();
        chat.setName(ua.getUsername() + " & " + ub.getUsername());
        chat.setIsGroup(false);
        chat.setCreatedAt(LocalDateTime.now());
        chat.setParticipants(new ArrayList<>(List.of(ua, ub)));
        return chatRepository.save(chat);
    }

    /**
     * Dev convenience: ensure a mutual contact row and a 1:1 chat (used by {@code DevDataLoader}).
     */
    @Transactional
    public void ensureContactPairAndChat(Long userA, Long userB) {
        if (userA.equals(userB)) {
            return;
        }
        long[] o = Contact.orderedIds(userA, userB);
        if (contactRepository.findByOrderedPair(o[0], o[1]).isEmpty()) {
            Contact c = new Contact();
            c.setUserLow(userRepository.findById(o[0]).orElseThrow());
            c.setUserHigh(userRepository.findById(o[1]).orElseThrow());
            c.setCreatedAt(LocalDateTime.now());
            contactRepository.save(c);
        }
        findOrCreateDirectChat(userA, userB);
    }

    public boolean canExchangeMessagesInChat(Long userId, Chat chat) {
        if (!chat.getIsGroup()) {
            if (chat.getParticipants() == null || chat.getParticipants().size() != 2) {
                return false;
            }
            Long other = chat.getParticipants().stream()
                    .map(User::getId)
                    .filter(id -> !id.equals(userId))
                    .findFirst()
                    .orElse(null);
            return other != null && contactRepository.areContacts(userId, other);
        }
        for (User p : chat.getParticipants()) {
            if (p.getId().equals(userId)) {
                continue;
            }
            if (!contactRepository.areContacts(userId, p.getId())) {
                return false;
            }
        }
        return true;
    }
}

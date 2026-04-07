package com.chatsphere.backend.repository;

import com.chatsphere.backend.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    @Query("SELECT c FROM Contact c WHERE c.userLow.id = :low AND c.userHigh.id = :high")
    Optional<Contact> findByOrderedPair(@Param("low") long low, @Param("high") long high);

    @Query("SELECT c FROM Contact c JOIN FETCH c.userLow JOIN FETCH c.userHigh WHERE c.userLow.id = :uid OR c.userHigh.id = :uid")
    List<Contact> findAllInvolvingUser(@Param("uid") Long uid);

    default boolean areContacts(long userIdA, long userIdB) {
        if (userIdA == userIdB) return true;
        long[] o = Contact.orderedIds(userIdA, userIdB);
        return findByOrderedPair(o[0], o[1]).isPresent();
    }

    default Optional<Contact> findContact(long userIdA, long userIdB) {
        long[] o = Contact.orderedIds(userIdA, userIdB);
        return findByOrderedPair(o[0], o[1]);
    }
}

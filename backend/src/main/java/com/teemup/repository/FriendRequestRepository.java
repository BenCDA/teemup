package com.teemup.repository;

import com.teemup.entity.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, UUID> {

    @Query("SELECT fr FROM FriendRequest fr WHERE fr.receiver.id = :userId AND fr.status = 'PENDING'")
    List<FriendRequest> findPendingRequestsByReceiverId(@Param("userId") UUID userId);

    @Query("SELECT fr FROM FriendRequest fr WHERE fr.sender.id = :userId AND fr.status = 'PENDING'")
    List<FriendRequest> findPendingRequestsBySenderId(@Param("userId") UUID userId);

    @Query("SELECT fr FROM FriendRequest fr WHERE " +
           "((fr.sender.id = :user1Id AND fr.receiver.id = :user2Id) OR " +
           "(fr.sender.id = :user2Id AND fr.receiver.id = :user1Id)) AND fr.status = 'PENDING'")
    Optional<FriendRequest> findPendingRequestBetweenUsers(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    Boolean existsBySenderIdAndReceiverIdAndStatus(UUID senderId, UUID receiverId, FriendRequest.FriendRequestStatus status);
}

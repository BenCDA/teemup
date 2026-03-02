package com.teemup.repository;

import com.teemup.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {

    boolean existsByBlockerIdAndBlockedUserId(UUID blockerId, UUID blockedUserId);

    List<UserBlock> findByBlockerId(UUID blockerId);

    void deleteByBlockerIdAndBlockedUserId(UUID blockerId, UUID blockedUserId);

    @Query("SELECT ub.blockedUser.id FROM UserBlock ub WHERE ub.blocker.id = :userId " +
           "UNION SELECT ub.blocker.id FROM UserBlock ub WHERE ub.blockedUser.id = :userId")
    List<UUID> findAllBlockRelatedUserIds(@Param("userId") UUID userId);
}

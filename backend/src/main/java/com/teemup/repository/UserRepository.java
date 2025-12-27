package com.teemup.repository;

import com.teemup.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Optional<User> findByProviderAndProviderId(User.AuthProvider provider, String providerId);

    @Query("SELECT u FROM User u WHERE u.id != :userId AND u.id NOT IN " +
           "(SELECT f.id FROM User user JOIN user.friends f WHERE user.id = :userId)")
    List<User> findNonFriendUsers(@Param("userId") UUID userId);

    @Query("SELECT u FROM User u WHERE LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<User> searchUsers(@Param("query") String query);

    @Query("SELECT f FROM User u JOIN u.friends f WHERE u.id = :userId")
    List<User> findFriendsByUserId(@Param("userId") UUID userId);
}

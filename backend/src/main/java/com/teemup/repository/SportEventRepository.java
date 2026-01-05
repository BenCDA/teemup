package com.teemup.repository;

import com.teemup.entity.SportEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SportEventRepository extends JpaRepository<SportEvent, UUID> {

    List<SportEvent> findByUserIdOrderByDateAscStartTimeAsc(UUID userId);

    List<SportEvent> findByUserIdAndDateGreaterThanEqualOrderByDateAscStartTimeAsc(UUID userId, LocalDate date);

    @Query("SELECT e FROM SportEvent e WHERE e.user.id = :userId AND e.date BETWEEN :startDate AND :endDate ORDER BY e.date, e.startTime")
    List<SportEvent> findByUserIdAndDateBetween(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT e FROM SportEvent e WHERE e.isPublic = true AND e.date >= :date ORDER BY e.date, e.startTime")
    List<SportEvent> findPublicEventsFromDate(@Param("date") LocalDate date);

    @Query("SELECT e FROM SportEvent e WHERE e.sport = :sport AND e.isPublic = true AND e.date >= :date ORDER BY e.date, e.startTime")
    List<SportEvent> findPublicEventsBySportFromDate(@Param("sport") String sport, @Param("date") LocalDate date);
}

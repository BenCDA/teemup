package com.teemup.repository;

import com.teemup.entity.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserReportRepository extends JpaRepository<UserReport, UUID> {

    boolean existsByReporterIdAndReportedUserId(UUID reporterId, UUID reportedUserId);
}

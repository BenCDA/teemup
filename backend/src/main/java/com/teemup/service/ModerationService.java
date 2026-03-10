package com.teemup.service;

import com.teemup.dto.moderation.ReportUserRequest;
import com.teemup.dto.user.UserSummaryResponse;
import com.teemup.entity.User;
import com.teemup.entity.UserBlock;
import com.teemup.entity.UserReport;
import com.teemup.exception.UserNotFoundException;
import com.teemup.repository.UserBlockRepository;
import com.teemup.repository.UserReportRepository;
import com.teemup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModerationService {

    private final UserReportRepository reportRepository;
    private final UserBlockRepository blockRepository;
    private final UserRepository userRepository;

    @Transactional
    public void reportUser(UUID reporterId, UUID reportedUserId, ReportUserRequest request) {
        if (reporterId.equals(reportedUserId)) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous signaler vous-même");
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new UserNotFoundException(reporterId));
        User reported = userRepository.findById(reportedUserId)
                .orElseThrow(() -> new UserNotFoundException(reportedUserId));

        if (reportRepository.existsByReporterIdAndReportedUserId(reporterId, reportedUserId)) {
            throw new IllegalArgumentException("Vous avez déjà signalé cet utilisateur");
        }

        UserReport report = UserReport.builder()
                .reporter(reporter)
                .reportedUser(reported)
                .reason(request.getReason())
                .description(request.getDescription())
                .build();

        reportRepository.save(report);
        log.info("User {} reported user {} for: {}", reporterId, reportedUserId, request.getReason());
    }

    @Transactional
    public void blockUser(UUID blockerId, UUID blockedUserId) {
        if (blockerId.equals(blockedUserId)) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous bloquer vous-même");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new UserNotFoundException(blockerId));
        User blocked = userRepository.findById(blockedUserId)
                .orElseThrow(() -> new UserNotFoundException(blockedUserId));

        if (blockRepository.existsByBlockerIdAndBlockedUserId(blockerId, blockedUserId)) {
            throw new IllegalArgumentException("Cet utilisateur est déjà bloqué");
        }

        UserBlock block = UserBlock.builder()
                .blocker(blocker)
                .blockedUser(blocked)
                .build();

        blockRepository.save(block);
        log.info("User {} blocked user {}", blockerId, blockedUserId);
    }

    @Transactional
    public void unblockUser(UUID blockerId, UUID blockedUserId) {
        if (!blockRepository.existsByBlockerIdAndBlockedUserId(blockerId, blockedUserId)) {
            throw new IllegalArgumentException("Cet utilisateur n'est pas bloqué");
        }
        blockRepository.deleteByBlockerIdAndBlockedUserId(blockerId, blockedUserId);
        log.info("User {} unblocked user {}", blockerId, blockedUserId);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getBlockedUsers(UUID userId) {
        return blockRepository.findByBlockerId(userId).stream()
                .map(block -> UserSummaryResponse.fromEntity(block.getBlockedUser()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(UUID userId1, UUID userId2) {
        return blockRepository.existsByBlockerIdAndBlockedUserId(userId1, userId2)
                || blockRepository.existsByBlockerIdAndBlockedUserId(userId2, userId1);
    }

    @Transactional(readOnly = true)
    public List<UUID> getBlockedUserIds(UUID userId) {
        return blockRepository.findAllBlockRelatedUserIds(userId);
    }
}

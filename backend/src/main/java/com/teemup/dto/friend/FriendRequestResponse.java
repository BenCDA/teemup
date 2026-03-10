package com.teemup.dto.friend;

import com.teemup.dto.user.UserSummaryResponse;
import com.teemup.entity.FriendRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestResponse {

    private UUID id;
    private UserSummaryResponse sender;
    private UserSummaryResponse receiver;
    private String status;
    private LocalDateTime createdAt;

    public static FriendRequestResponse fromEntity(FriendRequest request) {
        return FriendRequestResponse.builder()
                .id(request.getId())
                .sender(UserSummaryResponse.fromEntity(request.getSender()))
                .receiver(UserSummaryResponse.fromEntity(request.getReceiver()))
                .status(request.getStatus().name())
                .createdAt(request.getCreatedAt())
                .build();
    }
}

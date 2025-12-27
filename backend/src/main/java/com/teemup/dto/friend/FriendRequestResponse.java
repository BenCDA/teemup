package com.teemup.dto.friend;

import com.teemup.dto.user.UserResponse;
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
    private UserResponse sender;
    private UserResponse receiver;
    private String status;
    private LocalDateTime createdAt;

    public static FriendRequestResponse fromEntity(FriendRequest request) {
        return FriendRequestResponse.builder()
                .id(request.getId())
                .sender(UserResponse.fromEntity(request.getSender()))
                .receiver(UserResponse.fromEntity(request.getReceiver()))
                .status(request.getStatus().name())
                .createdAt(request.getCreatedAt())
                .build();
    }
}

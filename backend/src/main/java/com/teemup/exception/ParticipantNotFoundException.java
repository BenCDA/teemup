package com.teemup.exception;

import java.util.UUID;

public class ParticipantNotFoundException extends RuntimeException {

    public ParticipantNotFoundException(UUID participantId) {
        super("Participant non trouvé: " + participantId);
    }

    public ParticipantNotFoundException(String message) {
        super(message);
    }
}

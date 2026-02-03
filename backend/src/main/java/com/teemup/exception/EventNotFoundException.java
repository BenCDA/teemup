package com.teemup.exception;

import java.util.UUID;

public class EventNotFoundException extends RuntimeException {

    public EventNotFoundException(UUID eventId) {
        super("Événement non trouvé: " + eventId);
    }

    public EventNotFoundException(String message) {
        super(message);
    }
}

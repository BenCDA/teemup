package com.teemup.exception;

import java.util.UUID;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(UUID userId) {
        super("Utilisateur non trouvé: " + userId);
    }

    public UserNotFoundException(String message) {
        super(message);
    }
}

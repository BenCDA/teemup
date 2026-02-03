package com.teemup.exception;

public class CannotJoinOwnEventException extends RuntimeException {

    public CannotJoinOwnEventException() {
        super("Vous ne pouvez pas rejoindre votre propre événement");
    }

    public CannotJoinOwnEventException(String message) {
        super(message);
    }
}

package com.teemup.exception;

public class NotParticipatingException extends RuntimeException {

    public NotParticipatingException() {
        super("Vous ne participez pas à cet événement");
    }

    public NotParticipatingException(String message) {
        super(message);
    }
}

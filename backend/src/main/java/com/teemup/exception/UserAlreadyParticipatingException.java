package com.teemup.exception;

public class UserAlreadyParticipatingException extends RuntimeException {

    public UserAlreadyParticipatingException() {
        super("Vous participez déjà à cet événement");
    }

    public UserAlreadyParticipatingException(String message) {
        super(message);
    }
}

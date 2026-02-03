package com.teemup.exception;

public class UnauthorizedEventAccessException extends RuntimeException {

    public UnauthorizedEventAccessException() {
        super("Vous n'êtes pas autorisé à accéder à cet événement");
    }

    public UnauthorizedEventAccessException(String message) {
        super(message);
    }
}

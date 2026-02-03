package com.teemup.exception;

public class PrivateEventException extends RuntimeException {

    public PrivateEventException() {
        super("Cet événement est privé");
    }

    public PrivateEventException(String message) {
        super(message);
    }
}

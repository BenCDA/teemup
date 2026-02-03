package com.teemup.exception;

public class EventFullException extends RuntimeException {

    public EventFullException() {
        super("Cet événement est complet");
    }

    public EventFullException(String message) {
        super(message);
    }
}

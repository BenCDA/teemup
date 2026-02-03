package com.teemup.exception;

public class InvalidLocationException extends RuntimeException {

    public InvalidLocationException() {
        super("La localisation est requise pour cette recherche");
    }

    public InvalidLocationException(String message) {
        super(message);
    }
}

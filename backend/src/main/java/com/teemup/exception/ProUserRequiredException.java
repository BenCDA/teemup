package com.teemup.exception;

public class ProUserRequiredException extends RuntimeException {
    public ProUserRequiredException() {
        super("Seuls les utilisateurs Pro peuvent créer des événements payants");
    }
}

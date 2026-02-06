package com.teemup.exception;

/**
 * Exception for friend request related errors.
 * Covers: request not found, already friends, pending request exists, unauthorized access.
 */
public class FriendRequestException extends RuntimeException {

    private final String code;

    public FriendRequestException(String message, String code) {
        super(message);
        this.code = code;
    }

    public FriendRequestException(String message) {
        super(message);
        this.code = "FRIEND_REQUEST_ERROR";
    }

    public String getCode() {
        return code;
    }

    // Factory methods for common cases
    public static FriendRequestException notFound() {
        return new FriendRequestException("Demande d'ami non trouvée", "FRIEND_REQUEST_NOT_FOUND");
    }

    public static FriendRequestException alreadyFriends() {
        return new FriendRequestException("Vous êtes déjà amis avec cet utilisateur", "ALREADY_FRIENDS");
    }

    public static FriendRequestException alreadySent() {
        return new FriendRequestException("Demande d'ami déjà envoyée", "REQUEST_ALREADY_SENT");
    }

    public static FriendRequestException alreadyReceived() {
        return new FriendRequestException("Cet utilisateur vous a déjà envoyé une demande", "REQUEST_ALREADY_RECEIVED");
    }

    public static FriendRequestException cannotSendToSelf() {
        return new FriendRequestException("Impossible d'envoyer une demande à vous-même", "CANNOT_SEND_TO_SELF");
    }

    public static FriendRequestException notPending() {
        return new FriendRequestException("Cette demande n'est plus en attente", "REQUEST_NOT_PENDING");
    }

    public static FriendRequestException unauthorized() {
        return new FriendRequestException("Non autorisé à effectuer cette action", "UNAUTHORIZED");
    }
}

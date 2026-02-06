package com.teemup.exception;

/**
 * Exception for conversation and messaging related errors.
 * Covers: conversation not found, not participant, message not found, unauthorized access.
 */
public class ConversationException extends RuntimeException {

    private final String code;

    public ConversationException(String message, String code) {
        super(message);
        this.code = code;
    }

    public ConversationException(String message) {
        super(message);
        this.code = "CONVERSATION_ERROR";
    }

    public String getCode() {
        return code;
    }

    // Factory methods for common cases
    public static ConversationException notFound() {
        return new ConversationException("Conversation non trouvée", "CONVERSATION_NOT_FOUND");
    }

    public static ConversationException notParticipant() {
        return new ConversationException("Vous n'êtes pas participant de cette conversation", "NOT_PARTICIPANT");
    }

    public static ConversationException messageNotFound() {
        return new ConversationException("Message non trouvé", "MESSAGE_NOT_FOUND");
    }

    public static ConversationException notMessageSender() {
        return new ConversationException("Seul l'expéditeur peut modifier ce message", "NOT_MESSAGE_SENDER");
    }

    public static ConversationException mustBeFriends(String userName) {
        return new ConversationException(
                "Vous devez être amis pour envoyer un message à " + userName,
                "MUST_BE_FRIENDS"
        );
    }

    public static ConversationException creationFailed() {
        return new ConversationException("Impossible de créer la conversation", "CREATION_FAILED");
    }
}

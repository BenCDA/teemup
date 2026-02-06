package com.teemup.exception;

/**
 * Exception for notification related errors.
 * Covers: notification not found, unauthorized access.
 */
public class NotificationException extends RuntimeException {

    private final String code;

    public NotificationException(String message, String code) {
        super(message);
        this.code = code;
    }

    public NotificationException(String message) {
        super(message);
        this.code = "NOTIFICATION_ERROR";
    }

    public String getCode() {
        return code;
    }

    // Factory methods for common cases
    public static NotificationException notFound() {
        return new NotificationException("Notification non trouvée", "NOTIFICATION_NOT_FOUND");
    }

    public static NotificationException unauthorized() {
        return new NotificationException("Non autorisé à accéder à cette notification", "UNAUTHORIZED");
    }
}

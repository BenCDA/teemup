package com.teemup.config;

import com.teemup.exception.CannotJoinOwnEventException;
import com.teemup.exception.ConversationException;
import com.teemup.exception.EmailAlreadyExistsException;
import com.teemup.exception.EventFullException;
import com.teemup.exception.EventNotFoundException;
import com.teemup.exception.FaceVerificationException;
import com.teemup.exception.FriendRequestException;
import com.teemup.exception.InvalidLocationException;
import com.teemup.exception.InvalidTokenException;
import com.teemup.exception.NotParticipatingException;
import com.teemup.exception.NotificationException;
import com.teemup.exception.ParticipantNotFoundException;
import com.teemup.exception.PrivateEventException;
import com.teemup.exception.ProUserRequiredException;
import com.teemup.exception.UnauthorizedEventAccessException;
import com.teemup.exception.UserAlreadyParticipatingException;
import com.teemup.exception.UserNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<Map<String, Object>> buildErrorResponse(String message, String code, HttpStatus status) {
        Map<String, Object> error = new HashMap<>();
        error.put("timestamp", LocalDateTime.now().toString());
        error.put("message", message);
        error.put("code", code);
        error.put("status", status.value());
        return ResponseEntity.status(status).body(error);
    }

    // ===================== CUSTOM BUSINESS EXCEPTIONS =====================

    @ExceptionHandler(EventNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEventNotFound(EventNotFoundException ex) {
        return buildErrorResponse(ex.getMessage(), "EVENT_NOT_FOUND", HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFound(UserNotFoundException ex) {
        return buildErrorResponse(ex.getMessage(), "USER_NOT_FOUND", HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UnauthorizedEventAccessException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorizedEventAccess(UnauthorizedEventAccessException ex) {
        return buildErrorResponse(ex.getMessage(), "UNAUTHORIZED_EVENT_ACCESS", HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(EventFullException.class)
    public ResponseEntity<Map<String, Object>> handleEventFull(EventFullException ex) {
        return buildErrorResponse(ex.getMessage(), "EVENT_FULL", HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UserAlreadyParticipatingException.class)
    public ResponseEntity<Map<String, Object>> handleUserAlreadyParticipating(UserAlreadyParticipatingException ex) {
        return buildErrorResponse(ex.getMessage(), "ALREADY_PARTICIPATING", HttpStatus.CONFLICT);
    }

    @ExceptionHandler(CannotJoinOwnEventException.class)
    public ResponseEntity<Map<String, Object>> handleCannotJoinOwnEvent(CannotJoinOwnEventException ex) {
        return buildErrorResponse(ex.getMessage(), "CANNOT_JOIN_OWN_EVENT", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(PrivateEventException.class)
    public ResponseEntity<Map<String, Object>> handlePrivateEvent(PrivateEventException ex) {
        return buildErrorResponse(ex.getMessage(), "PRIVATE_EVENT", HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(NotParticipatingException.class)
    public ResponseEntity<Map<String, Object>> handleNotParticipating(NotParticipatingException ex) {
        return buildErrorResponse(ex.getMessage(), "NOT_PARTICIPATING", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ParticipantNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleParticipantNotFound(ParticipantNotFoundException ex) {
        return buildErrorResponse(ex.getMessage(), "PARTICIPANT_NOT_FOUND", HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InvalidLocationException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidLocation(InvalidLocationException ex) {
        return buildErrorResponse(ex.getMessage(), "INVALID_LOCATION", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ProUserRequiredException.class)
    public ResponseEntity<Map<String, Object>> handleProUserRequired(ProUserRequiredException ex) {
        return buildErrorResponse(ex.getMessage(), "PRO_USER_REQUIRED", HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(FriendRequestException.class)
    public ResponseEntity<Map<String, Object>> handleFriendRequest(FriendRequestException ex) {
        return buildErrorResponse(ex.getMessage(), ex.getCode(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConversationException.class)
    public ResponseEntity<Map<String, Object>> handleConversation(ConversationException ex) {
        return buildErrorResponse(ex.getMessage(), ex.getCode(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NotificationException.class)
    public ResponseEntity<Map<String, Object>> handleNotification(NotificationException ex) {
        return buildErrorResponse(ex.getMessage(), ex.getCode(), HttpStatus.BAD_REQUEST);
    }

    // ===================== EXISTING EXCEPTIONS =====================

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, Object>> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return buildErrorResponse(ex.getMessage(), "EMAIL_EXISTS", HttpStatus.CONFLICT);
    }

    @ExceptionHandler(FaceVerificationException.class)
    public ResponseEntity<Map<String, Object>> handleFaceVerification(FaceVerificationException ex) {
        return buildErrorResponse(ex.getMessage(), "FACE_VERIFICATION_FAILED", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidToken(InvalidTokenException ex) {
        return buildErrorResponse(ex.getMessage(), "INVALID_TOKEN", HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFound(EntityNotFoundException ex) {
        return buildErrorResponse(ex.getMessage(), "NOT_FOUND", HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildErrorResponse("Accès refusé", "ACCESS_DENIED", HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildErrorResponse(ex.getMessage(), "INVALID_ARGUMENT", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildErrorResponse("Email ou mot de passe invalide", "BAD_CREDENTIALS", HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("message", "Validation échouée");
        response.put("code", "VALIDATION_FAILED");
        response.put("errors", errors);
        response.put("status", HttpStatus.BAD_REQUEST.value());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParams(MissingServletRequestParameterException ex) {
        return buildErrorResponse("Paramètre requis manquant: " + ex.getParameterName(), "MISSING_PARAMETER", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return buildErrorResponse("Type de paramètre invalide: " + ex.getName(), "TYPE_MISMATCH", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        return buildErrorResponse("Corps de requête invalide", "INVALID_REQUEST_BODY", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return buildErrorResponse("Méthode HTTP non supportée: " + ex.getMethod(), "METHOD_NOT_SUPPORTED", HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return buildErrorResponse("Une erreur inattendue s'est produite", "INTERNAL_ERROR", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

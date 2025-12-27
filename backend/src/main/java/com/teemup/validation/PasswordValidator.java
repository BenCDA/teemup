package com.teemup.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

    private static final int MIN_LENGTH = 8;

    @Override
    public void initialize(ValidPassword constraintAnnotation) {
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isBlank()) {
            return false;
        }

        boolean hasMinLength = password.length() >= MIN_LENGTH;
        boolean hasUppercase = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLowercase = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecialChar = password.chars().anyMatch(c -> !Character.isLetterOrDigit(c));

        if (!hasMinLength || !hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
            context.disableDefaultConstraintViolation();

            StringBuilder message = new StringBuilder("Le mot de passe doit contenir ");
            if (!hasMinLength) message.append("au moins 8 caractères, ");
            if (!hasUppercase) message.append("une majuscule, ");
            if (!hasLowercase) message.append("une minuscule, ");
            if (!hasDigit) message.append("un chiffre, ");
            if (!hasSpecialChar) message.append("un caractère spécial (!@#$%^&*), ");

            String errorMessage = message.substring(0, message.length() - 2);
            context.buildConstraintViolationWithTemplate(errorMessage).addConstraintViolation();

            return false;
        }

        return true;
    }
}

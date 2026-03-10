package com.teemup.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordValidator Tests")
class PasswordValidatorTest {

    private PasswordValidator validator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder violationBuilder;

    @BeforeEach
    void setUp() {
        validator = new PasswordValidator();
        validator.initialize(null);
    }

    private void setupContextForInvalid() {
        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(violationBuilder);
    }

    @Nested
    @DisplayName("Valid passwords")
    class ValidPasswords {

        @Test
        @DisplayName("Should accept a strong password")
        void shouldAcceptStrongPassword() {
            assertThat(validator.isValid("MyP@ss1234", context)).isTrue();
        }

        @Test
        @DisplayName("Should accept password with exactly 8 characters")
        void shouldAcceptMinLength() {
            assertThat(validator.isValid("Ab1!xxxx", context)).isTrue();
        }
    }

    @Nested
    @DisplayName("Invalid passwords")
    class InvalidPasswords {

        @Test
        @DisplayName("Should reject null password")
        void shouldRejectNull() {
            assertThat(validator.isValid(null, context)).isFalse();
        }

        @Test
        @DisplayName("Should reject blank password")
        void shouldRejectBlank() {
            assertThat(validator.isValid("   ", context)).isFalse();
        }

        @Test
        @DisplayName("Should reject too short password")
        void shouldRejectTooShort() {
            setupContextForInvalid();
            assertThat(validator.isValid("Ab1!x", context)).isFalse();
        }

        @Test
        @DisplayName("Should reject password without uppercase")
        void shouldRejectNoUppercase() {
            setupContextForInvalid();
            assertThat(validator.isValid("myp@ss1234", context)).isFalse();
        }

        @Test
        @DisplayName("Should reject password without lowercase")
        void shouldRejectNoLowercase() {
            setupContextForInvalid();
            assertThat(validator.isValid("MYP@SS1234", context)).isFalse();
        }

        @Test
        @DisplayName("Should reject password without digit")
        void shouldRejectNoDigit() {
            setupContextForInvalid();
            assertThat(validator.isValid("MyP@ssword", context)).isFalse();
        }

        @Test
        @DisplayName("Should reject password without special character")
        void shouldRejectNoSpecialChar() {
            setupContextForInvalid();
            assertThat(validator.isValid("MyPass1234", context)).isFalse();
        }
    }
}

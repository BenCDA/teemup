package com.teemup.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RateLimitFilter Tests")
class RateLimitFilterTest {

    private RateLimitFilter rateLimitFilter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        rateLimitFilter = new RateLimitFilter();
    }

    private void setupRequest(String ip, String path) {
        when(request.getRemoteAddr()).thenReturn(ip);
        when(request.getRequestURI()).thenReturn(path);
    }

    private StringWriter setup429Response() throws Exception {
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);
        return stringWriter;
    }

    @Nested
    @DisplayName("General rate limiting")
    class GeneralRateLimiting {

        @Test
        @DisplayName("Should allow normal API request")
        void shouldAllowNormalRequest() throws Exception {
            setupRequest("10.0.0.1", "/api/events");

            rateLimitFilter.doFilter(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }

        @Test
        @DisplayName("Should block after 60 general requests")
        void shouldBlockAfter60Requests() throws Exception {
            setupRequest("10.0.0.2", "/api/events");

            // First 60 requests should pass
            for (int i = 0; i < 60; i++) {
                rateLimitFilter.doFilter(request, response, filterChain);
            }
            verify(filterChain, times(60)).doFilter(request, response);

            // 61st request should be blocked
            StringWriter writer = setup429Response();
            rateLimitFilter.doFilter(request, response, filterChain);

            verify(response).setStatus(429);
            assertThat(writer.toString()).contains("RATE_LIMIT_EXCEEDED");
        }
    }

    @Nested
    @DisplayName("Auth rate limiting")
    class AuthRateLimiting {

        @Test
        @DisplayName("Should block auth endpoint after 5 requests")
        void shouldBlockAuthAfter5() throws Exception {
            setupRequest("10.0.0.3", "/api/auth/login");

            for (int i = 0; i < 5; i++) {
                rateLimitFilter.doFilter(request, response, filterChain);
            }
            verify(filterChain, times(5)).doFilter(request, response);

            StringWriter writer = setup429Response();
            rateLimitFilter.doFilter(request, response, filterChain);

            verify(response).setStatus(429);
            assertThat(writer.toString()).contains("RATE_LIMIT_EXCEEDED");
        }

        @Test
        @DisplayName("Should apply auth limit to register endpoint")
        void shouldLimitRegister() throws Exception {
            setupRequest("10.0.0.4", "/api/auth/register");

            for (int i = 0; i < 5; i++) {
                rateLimitFilter.doFilter(request, response, filterChain);
            }

            setup429Response();
            rateLimitFilter.doFilter(request, response, filterChain);

            verify(response).setStatus(429);
        }
    }

    @Nested
    @DisplayName("IP resolution")
    class IpResolution {

        @Test
        @DisplayName("Should use X-Forwarded-For only from trusted proxy")
        void shouldUseForwardedFor() throws Exception {
            rateLimitFilter.setTrustForwardedFor(true);
            rateLimitFilter.setTrustedProxies("10.0.0.10");
            when(request.getRemoteAddr()).thenReturn("10.0.0.10");
            when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.50, 70.41.3.18");
            when(request.getRequestURI()).thenReturn("/api/events");

            rateLimitFilter.doFilter(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }

        @Test
        @DisplayName("Should ignore X-Forwarded-For from untrusted source")
        void shouldIgnoreForwardedForWhenUntrusted() throws Exception {
            when(request.getRemoteAddr()).thenReturn("10.0.0.20");
            when(request.getRequestURI()).thenReturn("/api/events");

            rateLimitFilter.doFilter(request, response, filterChain);

            verify(filterChain).doFilter(request, response);
        }
    }

    @Nested
    @DisplayName("Non-API paths")
    class NonApiPaths {

        @Test
        @DisplayName("Should not rate limit non-API paths")
        void shouldNotLimitNonApiPaths() throws Exception {
            setupRequest("10.0.0.5", "/swagger-ui.html");

            for (int i = 0; i < 100; i++) {
                rateLimitFilter.doFilter(request, response, filterChain);
            }

            verify(filterChain, times(100)).doFilter(request, response);
            verify(response, never()).setStatus(429);
        }
    }

    @Nested
    @DisplayName("Cleanup")
    class Cleanup {

        @Test
        @DisplayName("Should cleanup without errors")
        void shouldCleanupWithoutErrors() throws Exception {
            // Make a request to populate buckets
            setupRequest("10.0.0.99", "/api/test");
            rateLimitFilter.doFilter(request, response, filterChain);

            rateLimitFilter.cleanupExpiredBuckets();

            // After cleanup, requests should still work (bucket not yet expired)
            rateLimitFilter.doFilter(request, response, filterChain);
            verify(filterChain, times(2)).doFilter(request, response);
        }
    }
}

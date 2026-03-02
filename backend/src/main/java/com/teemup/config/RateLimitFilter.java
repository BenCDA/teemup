package com.teemup.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory rate limiting filter.
 *
 * - General API endpoints: 60 requests per minute per IP.
 * - Auth endpoints (login, register, refresh): 5 requests per minute per IP.
 *
 * Old entries are cleaned up every 60 seconds via a scheduled task.
 */
@Component
@Order(1)
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final int GENERAL_LIMIT = 60;
    private static final int AUTH_LIMIT = 5;
    private static final long WINDOW_MS = 60_000; // 1 minute

    private static final Set<String> AUTH_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh"
    );

    /**
     * Tracks request counts and window start time for each bucket (IP or IP + auth path).
     */
    private final ConcurrentHashMap<String, RequestBucket> buckets = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (!(request instanceof HttpServletRequest httpRequest)
                || !(response instanceof HttpServletResponse httpResponse)) {
            chain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(httpRequest);
        String path = httpRequest.getRequestURI();

        // Check auth-specific rate limit first
        if (AUTH_PATHS.contains(path)) {
            String authKey = clientIp + ":auth:" + path;
            if (isRateLimited(authKey, AUTH_LIMIT)) {
                log.warn("Auth rate limit exceeded for IP {} on path {}", clientIp, path);
                sendTooManyRequests(httpResponse);
                return;
            }
        }

        // Check general rate limit for all API paths
        if (path.startsWith("/api/")) {
            String generalKey = clientIp + ":general";
            if (isRateLimited(generalKey, GENERAL_LIMIT)) {
                log.warn("General rate limit exceeded for IP {}", clientIp);
                sendTooManyRequests(httpResponse);
                return;
            }
        }

        chain.doFilter(request, response);
    }

    /**
     * Returns true if the given bucket key has exceeded its allowed limit within the current window.
     */
    private boolean isRateLimited(String key, int limit) {
        long now = System.currentTimeMillis();
        RequestBucket bucket = buckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart > WINDOW_MS) {
                // New window
                return new RequestBucket(now, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });
        return bucket.count.get() > limit;
    }

    /**
     * Extracts the client IP, checking X-Forwarded-For for proxied requests.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // Take the first IP in the chain (the original client)
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Writes a 429 Too Many Requests JSON response consistent with the project error format.
     */
    private void sendTooManyRequests(HttpServletResponse response) throws IOException {
        Map<String, Object> error = new HashMap<>();
        error.put("timestamp", LocalDateTime.now().toString());
        error.put("message", "Trop de requêtes. Veuillez réessayer plus tard.");
        error.put("code", "RATE_LIMIT_EXCEEDED");
        error.put("status", 429);

        response.setStatus(429);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }

    /**
     * Periodically removes expired buckets (runs every 60 seconds).
     */
    @Scheduled(fixedRate = 60_000)
    public void cleanupExpiredBuckets() {
        long now = System.currentTimeMillis();
        int removed = 0;
        var iterator = buckets.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            if (now - entry.getValue().windowStart > WINDOW_MS) {
                iterator.remove();
                removed++;
            }
        }
        if (removed > 0) {
            log.debug("Rate limit cleanup: removed {} expired bucket(s), {} remaining", removed, buckets.size());
        }
    }

    /**
     * Simple holder for a rate-limit window: start time + request count.
     */
    private static class RequestBucket {
        final long windowStart;
        final AtomicInteger count;

        RequestBucket(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}

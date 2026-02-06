package com.teemup.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("service", "TeemUp Backend");
        health.put("timestamp", LocalDateTime.now().toString());
        health.put("version", "1.0.0");

        // Check database connectivity
        Map<String, Object> dbHealth = new HashMap<>();
        try (Connection conn = dataSource.getConnection()) {
            boolean isValid = conn.isValid(5); // 5 second timeout
            dbHealth.put("status", isValid ? "UP" : "DOWN");
            dbHealth.put("database", conn.getMetaData().getDatabaseProductName());
        } catch (Exception e) {
            dbHealth.put("status", "DOWN");
            dbHealth.put("error", e.getMessage());
        }
        health.put("database", dbHealth);

        // Overall status
        boolean isHealthy = "UP".equals(dbHealth.get("status"));
        health.put("status", isHealthy ? "UP" : "DOWN");

        return isHealthy
                ? ResponseEntity.ok(health)
                : ResponseEntity.status(503).body(health);
    }

    @GetMapping("/health/live")
    public ResponseEntity<Map<String, String>> liveness() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @GetMapping("/health/ready")
    public ResponseEntity<Map<String, Object>> readiness() {
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(5)) {
                return ResponseEntity.ok(Map.of(
                        "status", "UP",
                        "database", "connected"
                ));
            }
        } catch (Exception ignored) {
        }
        return ResponseEntity.status(503).body(Map.of(
                "status", "DOWN",
                "database", "not connected"
        ));
    }
}

package com.example.CRUD.controller;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final StringRedisTemplate redis;

    public HealthController(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "LedgerLine");
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, String>> ready() {
        try {
            redis.getConnectionFactory().getConnection().ping();
            return ResponseEntity.ok(Map.of("status", "READY", "redis", "UP"));
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("status", "NOT_READY", "redis", "DOWN"));
        }
    }
}

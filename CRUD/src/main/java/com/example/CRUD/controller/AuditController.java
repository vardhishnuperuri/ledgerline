package com.example.CRUD.controller;

import com.example.CRUD.entity.AuditLog;
import com.example.CRUD.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('AUDITOR')")
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditService.getAllLogs());
    }

    @GetMapping("/{entityType}/{entityId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('AUDITOR')")
    public ResponseEntity<List<AuditLog>> getLogsForEntity(@PathVariable String entityType,
                                                            @PathVariable Long entityId) {
        return ResponseEntity.ok(auditService.getLogsForEntity(entityType, entityId));
    }
}

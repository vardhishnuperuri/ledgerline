package com.example.CRUD.service;

import com.example.CRUD.entity.AuditLog;
import com.example.CRUD.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String actor, String action, String entityType, Long entityId, String detail) {
        auditLogRepository.save(new AuditLog(actor, action, entityType, entityId, detail));
    }

    public List<AuditLog> getLogsForEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    public Page<AuditLog> searchLogs(String actor, String action, LocalDateTime from, LocalDateTime to,
                                      int page, int size) {
        String actorParam = (actor != null && !actor.isBlank()) ? actor : null;
        String actionParam = (action != null && !action.equals("ALL")) ? action : null;
        return auditLogRepository.search(actorParam, actionParam, from, to, PageRequest.of(page, size));
    }
}

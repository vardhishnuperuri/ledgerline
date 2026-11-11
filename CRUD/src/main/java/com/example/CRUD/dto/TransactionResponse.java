package com.example.CRUD.dto;

import com.example.CRUD.entity.Transaction;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionResponse {
    private Long id;
    private String idempotencyKey;
    private String type;
    private String status;
    private BigDecimal amount;
    private String description;
    private LocalDateTime createdAt;
    private String fromAccountNumber;
    private String toAccountNumber;

    public static TransactionResponse from(Transaction t) {
        TransactionResponse r = new TransactionResponse();
        r.id = t.getId();
        r.idempotencyKey = t.getIdempotencyKey();
        r.type = t.getType().name();
        r.status = t.getStatus();
        r.amount = t.getAmount();
        r.description = t.getDescription();
        r.createdAt = t.getCreatedAt();
        r.fromAccountNumber = t.getFromAccount() != null ? t.getFromAccount().getAccountNumber() : null;
        r.toAccountNumber = t.getToAccount() != null ? t.getToAccount().getAccountNumber() : null;
        return r;
    }

    public Long getId() { return id; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public BigDecimal getAmount() { return amount; }
    public String getDescription() { return description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getFromAccountNumber() { return fromAccountNumber; }
    public String getToAccountNumber() { return toAccountNumber; }
}

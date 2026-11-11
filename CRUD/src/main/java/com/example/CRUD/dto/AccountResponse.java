package com.example.CRUD.dto;

import com.example.CRUD.entity.Account;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AccountResponse {
    private Long id;
    private String accountNumber;
    private BigDecimal balance;
    private String currency;
    private String status;
    private String accountType;
    private LocalDateTime createdAt;
    private OwnerInfo owner;

    public static AccountResponse from(Account a) {
        AccountResponse r = new AccountResponse();
        r.id = a.getId();
        r.accountNumber = a.getAccountNumber();
        r.balance = a.getBalance();
        r.currency = a.getCurrency();
        r.status = a.getStatus().name();
        r.accountType = a.getAccountType().name();
        r.createdAt = a.getCreatedAt();
        if (a.getOwner() != null) {
            r.owner = new OwnerInfo(a.getOwner().getId(), a.getOwner().getUsername());
        }
        return r;
    }

    public static class OwnerInfo {
        public Long id;
        public String username;
        public OwnerInfo(Long id, String username) { this.id = id; this.username = username; }
    }

    public Long getId() { return id; }
    public String getAccountNumber() { return accountNumber; }
    public BigDecimal getBalance() { return balance; }
    public String getCurrency() { return currency; }
    public String getStatus() { return status; }
    public String getAccountType() { return accountType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public OwnerInfo getOwner() { return owner; }
}

package com.example.CRUD.service;

import com.example.CRUD.dto.AccountResponse;
import com.example.CRUD.entity.Account;
import com.example.CRUD.entity.User;
import com.example.CRUD.repository.AccountRepository;
import com.example.CRUD.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository,
                          AuditService auditService) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public AccountResponse requestAccount(String username, String accountType) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Account.AccountType type;
        try {
            type = Account.AccountType.valueOf(accountType != null ? accountType.toUpperCase() : "PERSONAL");
        } catch (IllegalArgumentException e) {
            type = Account.AccountType.PERSONAL;
        }

        Account account = new Account();
        account.setOwner(owner);
        account.setAccountNumber("REQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        account.setBalance(BigDecimal.ZERO);
        account.setCurrency("USD");
        account.setStatus(Account.Status.PENDING);
        account.setAccountType(type);
        accountRepository.save(account);

        auditService.log(username, "ACCOUNT_REQUESTED", "ACCOUNT", account.getId(),
                "Account request submitted: " + account.getAccountNumber() + " type=" + type);
        return AccountResponse.from(account);
    }

    @Transactional
    public AccountResponse approveAccount(Long accountId, String adminUsername) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getStatus() != Account.Status.PENDING)
            throw new IllegalArgumentException("Account is not pending");

        account.setStatus(Account.Status.ACTIVE);
        account.setAccountNumber("ACC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        accountRepository.save(account);

        auditService.log(adminUsername, "ACCOUNT_APPROVED", "ACCOUNT", account.getId(),
                "Account approved: " + account.getAccountNumber() + " for user " + account.getOwner().getUsername());
        return AccountResponse.from(account);
    }

    @Transactional
    public AccountResponse rejectAccount(Long accountId, String adminUsername) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getStatus() != Account.Status.PENDING)
            throw new IllegalArgumentException("Account is not pending");

        account.setStatus(Account.Status.REJECTED);
        accountRepository.save(account);

        auditService.log(adminUsername, "ACCOUNT_REJECTED", "ACCOUNT", account.getId(),
                "Account rejected for user " + account.getOwner().getUsername());
        return AccountResponse.from(account);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getPendingAccounts() {
        return accountRepository.findByStatus(Account.Status.PENDING)
                .stream().map(AccountResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getMyAccounts(String username) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return accountRepository.findByOwnerId(owner.getId())
                .stream().map(AccountResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccount(Long id, String username) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!account.getOwner().getId().equals(user.getId()) &&
                user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.AUDITOR)
            throw new SecurityException("Access denied");

        return AccountResponse.from(account);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll()
                .stream().map(AccountResponse::from).collect(Collectors.toList());
    }
}

package com.example.CRUD.controller;

import com.example.CRUD.dto.AccountResponse;
import com.example.CRUD.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping("/request")
    @PreAuthorize("hasRole('ACCOUNT_HOLDER') or hasRole('ADMIN')")
    public ResponseEntity<AccountResponse> requestAccount(@RequestBody Map<String, String> body,
                                                           @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(accountService.requestAccount(username, body.get("accountType")));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AccountResponse> approve(@PathVariable Long id,
                                                    @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(accountService.approveAccount(id, username));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AccountResponse> reject(@PathVariable Long id,
                                                   @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(accountService.rejectAccount(id, username));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AccountResponse>> getPending() {
        return ResponseEntity.ok(accountService.getPendingAccounts());
    }

    @GetMapping
    @PreAuthorize("hasRole('ACCOUNT_HOLDER') or hasRole('ADMIN')")
    public ResponseEntity<List<AccountResponse>> myAccounts(@AuthenticationPrincipal String username) {
        return ResponseEntity.ok(accountService.getMyAccounts(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccount(@PathVariable Long id,
                                                       @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(accountService.getAccount(id, username));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('AUDITOR')")
    public ResponseEntity<List<AccountResponse>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts());
    }
}

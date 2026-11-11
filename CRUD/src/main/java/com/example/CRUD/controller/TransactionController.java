package com.example.CRUD.controller;

import com.example.CRUD.dto.DepositWithdrawRequest;
import com.example.CRUD.dto.TransactionResponse;
import com.example.CRUD.dto.TransferRequest;
import com.example.CRUD.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TransactionResponse> deposit(@Valid @RequestBody DepositWithdrawRequest req,
                                                        @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(transactionService.deposit(req, username));
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasRole('ACCOUNT_HOLDER') or hasRole('ADMIN')")
    public ResponseEntity<TransactionResponse> withdraw(@Valid @RequestBody DepositWithdrawRequest req,
                                                         @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(transactionService.withdraw(req, username));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasRole('ACCOUNT_HOLDER') or hasRole('ADMIN')")
    public ResponseEntity<TransactionResponse> transfer(@Valid @RequestBody TransferRequest req,
                                                         @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(transactionService.transfer(req, username));
    }

    @GetMapping("/statement/{accountId}")
    public ResponseEntity<List<TransactionResponse>> statement(@PathVariable Long accountId,
                                                                @AuthenticationPrincipal String username) {
        return ResponseEntity.ok(transactionService.getStatement(accountId, username));
    }
}

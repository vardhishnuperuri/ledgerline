package com.example.CRUD.service;

import com.example.CRUD.dto.DepositWithdrawRequest;
import com.example.CRUD.dto.TransactionResponse;
import com.example.CRUD.dto.TransferRequest;
import com.example.CRUD.entity.Account;
import com.example.CRUD.entity.Transaction;
import com.example.CRUD.entity.User;
import com.example.CRUD.repository.AccountRepository;
import com.example.CRUD.repository.TransactionRepository;
import com.example.CRUD.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public TransactionService(TransactionRepository transactionRepository,
                               AccountRepository accountRepository,
                               UserRepository userRepository,
                               AuditService auditService) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public TransactionResponse deposit(DepositWithdrawRequest req, String actor) {
        var existing = transactionRepository.findByIdempotencyKey(req.getIdempotencyKey());
        if (existing.isPresent()) return TransactionResponse.from(existing.get());

        Account account = accountRepository.findByIdWithLock(req.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getStatus() != Account.Status.ACTIVE)
            throw new IllegalArgumentException("Account is not active");

        account.setBalance(account.getBalance().add(req.getAmount()));
        accountRepository.save(account);

        Transaction tx = buildTransaction(req.getIdempotencyKey(), null, account,
                req.getAmount(), Transaction.Type.DEPOSIT, req.getDescription());
        transactionRepository.save(tx);

        auditService.log(actor, "DEPOSIT", "TRANSACTION", tx.getId(),
                "Deposited " + req.getAmount() + " to account " + account.getAccountNumber());
        return TransactionResponse.from(tx);
    }

    @Transactional
    public TransactionResponse withdraw(DepositWithdrawRequest req, String actor) {
        var existing = transactionRepository.findByIdempotencyKey(req.getIdempotencyKey());
        if (existing.isPresent()) return TransactionResponse.from(existing.get());

        Account account = accountRepository.findByIdWithLock(req.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getStatus() != Account.Status.ACTIVE)
            throw new IllegalArgumentException("Account is not active");

        if (account.getBalance().compareTo(req.getAmount()) < 0)
            throw new IllegalArgumentException("Insufficient funds");

        User actorUser = userRepository.findByUsername(actor)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!account.getOwner().getId().equals(actorUser.getId()) &&
                actorUser.getRole() != User.Role.ADMIN)
            throw new SecurityException("You do not own this account");

        account.setBalance(account.getBalance().subtract(req.getAmount()));
        accountRepository.save(account);

        Transaction tx = buildTransaction(req.getIdempotencyKey(), account, null,
                req.getAmount(), Transaction.Type.WITHDRAWAL, req.getDescription());
        transactionRepository.save(tx);

        auditService.log(actor, "WITHDRAWAL", "TRANSACTION", tx.getId(),
                "Withdrew " + req.getAmount() + " from account " + account.getAccountNumber());
        return TransactionResponse.from(tx);
    }

    @Transactional
    public TransactionResponse transfer(TransferRequest req, String actor) {
        var existing = transactionRepository.findByIdempotencyKey(req.getIdempotencyKey());
        if (existing.isPresent()) return TransactionResponse.from(existing.get());

        if (req.getFromAccountId().equals(req.getToAccountId()))
            throw new IllegalArgumentException("Cannot transfer to the same account");

        Long firstId = Math.min(req.getFromAccountId(), req.getToAccountId());
        Long secondId = Math.max(req.getFromAccountId(), req.getToAccountId());

        Account first = accountRepository.findByIdWithLock(firstId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        Account second = accountRepository.findByIdWithLock(secondId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        Account from = first.getId().equals(req.getFromAccountId()) ? first : second;
        Account to = first.getId().equals(req.getToAccountId()) ? first : second;

        if (from.getBalance().compareTo(req.getAmount()) < 0)
            throw new IllegalArgumentException("Insufficient funds");

        User actorUser = userRepository.findByUsername(actor)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!from.getOwner().getId().equals(actorUser.getId()) &&
                actorUser.getRole() != User.Role.ADMIN)
            throw new SecurityException("You do not own the source account");

        from.setBalance(from.getBalance().subtract(req.getAmount()));
        to.setBalance(to.getBalance().add(req.getAmount()));
        accountRepository.save(from);
        accountRepository.save(to);

        Transaction tx = buildTransaction(req.getIdempotencyKey(), from, to,
                req.getAmount(), Transaction.Type.TRANSFER, req.getDescription());
        transactionRepository.save(tx);

        auditService.log(actor, "TRANSFER", "TRANSACTION", tx.getId(),
                "Transferred " + req.getAmount() + " from " + from.getAccountNumber() + " to " + to.getAccountNumber());
        return TransactionResponse.from(tx);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getStatement(Long accountId, String actor) {
        User user = userRepository.findByUsername(actor)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getOwner().getId().equals(user.getId()) &&
                user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.AUDITOR)
            throw new SecurityException("Access denied");

        return transactionRepository.findByAccountId(accountId)
                .stream().map(TransactionResponse::from).collect(Collectors.toList());
    }

    private Transaction buildTransaction(String key, Account from, Account to,
                                          java.math.BigDecimal amount, Transaction.Type type, String desc) {
        Transaction tx = new Transaction();
        tx.setIdempotencyKey(key);
        tx.setFromAccount(from);
        tx.setToAccount(to);
        tx.setAmount(amount);
        tx.setType(type);
        tx.setDescription(desc);
        return tx;
    }
}

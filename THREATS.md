# THREATS.md — LedgerLine Threat Model

## 1. Broken Authentication

**Threat**: Attacker guesses or brute-forces passwords to gain access.

**Mitigation**:
- Passwords hashed with BCrypt (cost factor 8) — never stored in plaintext.
- JWT tokens expire after 24 hours (`jwt.expiration=86400000`).
- Login returns a generic "Invalid credentials" message for both wrong username and wrong password — no enumeration.

**Test**: `AuthIntegrationTest.login_with_wrong_password_fails()`

---

## 2. Broken Access Control — Horizontal Privilege Escalation

**Threat**: User A accesses User B's account by guessing account IDs.

**Mitigation**:
- `AccountService.getAccount()` checks `account.getOwner().getId().equals(user.getId())` before returning data.
- `TransactionService.withdraw()` and `transfer()` verify the actor owns the source account.
- Only ADMIN and AUDITOR roles can bypass ownership checks.

**Test**: `AccountWorkflowTest.user_cannot_approve_accounts()`

---

## 3. Broken Access Control — Vertical Privilege Escalation

**Threat**: Regular user calls admin-only endpoints (approve accounts, list all users, view audit log).

**Mitigation**:
- `@PreAuthorize("hasRole('ADMIN')")` on `/api/accounts/{id}/approve`, `/api/accounts/{id}/reject`, `/api/accounts/pending`, `/api/auth/users`.
- `@PreAuthorize("hasRole('ADMIN') or hasRole('AUDITOR')")` on `/api/audit` and `/api/accounts/all`.
- Spring Security enforces this server-side — frontend role checks are UI-only and not trusted.

**Test**: `AuthIntegrationTest.account_holder_cannot_access_admin_users_endpoint()`, `AuthIntegrationTest.account_holder_cannot_access_pending_accounts_endpoint()`

---

## 4. Unauthenticated Access to Protected Resources

**Threat**: Attacker calls API endpoints without a token.

**Mitigation**:
- `SecurityConfig` requires authentication for all routes except `/api/auth/**` and `/api/health`.
- `JwtFilter` validates the token signature and expiry on every request.
- Returns HTTP 401 for missing/invalid tokens.

**Test**: `AuthIntegrationTest.unauthenticated_request_to_protected_endpoint_returns_401()`

---

## 5. Race Condition / Double-Spend on Transfers

**Threat**: Concurrent transfer requests drain an account below zero.

**Mitigation**:
- `AccountRepository.findByIdWithLock()` uses `@Lock(LockModeType.PESSIMISTIC_WRITE)` — database-level row lock.
- Accounts are locked in consistent ID order (lower ID first) to prevent deadlocks.
- `balance_non_negative CHECK (balance >= 0)` constraint in the database as a final safety net.

---

## 6. Duplicate / Replayed Transactions

**Threat**: Network retry causes the same transfer to execute twice.

**Mitigation**:
- Every transaction requires a client-supplied `idempotencyKey` (UUID).
- `TransactionService` checks for an existing transaction with that key before processing.
- `idempotency_key` column has a `UNIQUE` constraint in the database.

---

## 7. Transaction on Non-Active Account

**Threat**: Funds deposited or withdrawn from a PENDING or REJECTED account.

**Mitigation**:
- `TransactionService.deposit()` and `withdraw()` check `account.getStatus() != Account.Status.ACTIVE` and throw `IllegalArgumentException` if not active.

**Test**: `AccountWorkflowTest.deposit_on_pending_account_is_blocked()`

---

## 8. JWT Secret Exposure

**Threat**: Weak or hardcoded JWT secret allows token forgery.

**Mitigation**:
- Secret is read from environment variable `JWT_SECRET` — not hardcoded in production.
- Default value in `application.properties` is clearly labelled "change-in-production".
- In Docker deployment, `JWT_SECRET` is passed via environment variable.

---

## 9. SQL Injection

**Threat**: Malicious input in API fields manipulates database queries.

**Mitigation**:
- All database access uses Spring Data JPA with parameterised queries — no raw SQL string concatenation.
- Flyway migrations use static SQL only.

---

## 10. Audit Trail Tampering

**Threat**: Actor deletes or modifies audit log entries to hide actions.

**Mitigation**:
- `audit_log` table has no DELETE or UPDATE endpoints exposed.
- `AuditLog` entity has no setters — immutable after creation.
- Only ADMIN and AUDITOR can read the audit log; nobody can write to it directly via API.

---

## 11. CORS Misconfiguration

**Threat**: Malicious website makes cross-origin requests using a victim's credentials.

**Mitigation**:
- CORS is restricted to `http://localhost:5173` in development.
- In production deployment, `ALLOWED_ORIGINS` should be set to the exact frontend domain.
- Credentials are allowed only for the whitelisted origin.

---

## 12. Sensitive Data in Responses

**Threat**: Password hashes or internal IDs leak in API responses.

**Mitigation**:
- `User` entity password field is never included in any response DTO.
- `AccountResponse` and `TransactionResponse` are explicit DTOs — no `@JsonIgnore` gaps.
- `@JsonIgnoreProperties({"password", ...})` on the `Account.owner` relationship.

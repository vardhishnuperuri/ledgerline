# PROMPTS.md — AI Tool Usage Log

This file documents how I used Amazon Q (AI coding assistant) during this project, what it produced, what was wrong, and what I changed.

---

## Entry 1 — 2026-10-19 — Initial project scaffold

**What I asked**: Set up a Spring Boot + React project with JWT authentication, PostgreSQL, and Flyway migrations. Include roles: ADMIN, ACCOUNT_HOLDER, AUDITOR.

**What the tool produced**: A working scaffold with `SecurityConfig`, `JwtFilter`, `JwtUtil`, `AuthController`, `AuthService`, and a Flyway `V1__init.sql` with seed users using placeholder password hashes.

**What was wrong**: The seed users had placeholder bcrypt hashes that would never match any real password. The tool didn't account for the fact that bcrypt hashes must be generated at runtime — you can't hardcode them in SQL.

**What I did instead**: Wrote `DataSeeder.java` myself — it runs on startup, detects placeholder hashes, and re-encodes them with the real BCryptPasswordEncoder. This runs every startup and is idempotent.

---

## Entry 2 — 2026-10-20 — Authorisation: account ownership enforcement

**What I asked**: Enforce that a user can only withdraw from or transfer out of their own account. Admin should be able to act on any account.

**What the tool produced**: A check in `TransactionService` comparing `account.getOwner().getId()` to the actor's user ID.

**What was wrong**: The tool initially used `account.getOwner().getUsername().equals(actor)` — comparing username strings. This is fragile because usernames could theoretically be changed. The correct check is by user ID.

**What I did instead**: Changed the check to compare `account.getOwner().getId().equals(actorUser.getId())` after loading the full `User` entity. This is identity-based, not string-based.

---

## Entry 3 — 2026-10-21 — Audit trail design

**What I asked**: Design an audit log that records every sensitive action — login, register, account creation, deposit, withdrawal, transfer, account approval/rejection.

**What the tool produced**: An `AuditLog` entity with `actorUsername`, `action`, `entityType`, `entityId`, `detail`, and `createdAt`. An `AuditService` with a `log()` method called from every service.

**What was wrong**: The tool made `AuditLog` a mutable JPA entity with setters. This is wrong for an audit log — entries must be immutable once written. A mutable audit log can be tampered with.

**What I did instead**: Removed all setters from `AuditLog`. The only constructor takes all fields. JPA can still read it via reflection. No UPDATE or DELETE endpoint is exposed. Documented this in THREATS.md threat #10.

---

## Entry 4 — 2026-10-22 — Account request and approval workflow

**What I asked**: Add an account request workflow — users submit a request (PENDING), admin approves or rejects it. Only ACTIVE accounts can have transactions.

**What the tool produced**: Added `status` and `accountType` fields to `Account`, new endpoints `/request`, `/{id}/approve`, `/{id}/reject`, `/{id}/pending`, and a Flyway migration `V3__account_requests.sql`.

**What was wrong**: The tool's `approveAccount()` method didn't change the account number from the `REQ-` prefix to a proper `ACC-` number. A PENDING account has a `REQ-XXXXXXXX` number as a placeholder. On approval it should get a real `ACC-` number.

**What I did instead**: Added `account.setAccountNumber("ACC-" + UUID.randomUUID()...)` inside `approveAccount()` so the account number is only assigned on approval.

---

## Entry 5 — 2026-10-22 — Tests: authorisation coverage

**What I asked**: Write integration tests covering: unauthenticated access returns 401, account holder cannot reach admin endpoints (403), admin can approve/reject accounts, deposit on PENDING account is blocked.

**What the tool produced**: `AuthIntegrationTest` and `AccountWorkflowTest` using MockMvc with `@SpringBootTest` and `@ActiveProfiles("test")`.

**What was wrong**: The tool initially configured tests to use the real PostgreSQL database, which means tests would fail on any machine without the local DB running. It also didn't create the `src/test/resources/` directory or the `application-test.properties` file.

**What I did instead**: Created `application-test.properties` with H2 in-memory database, disabled Flyway for tests (H2 uses `ddl-auto=create-drop` instead), and added H2 as a test-scope dependency in `pom.xml`. Tests now run anywhere with `mvn test` and no external dependencies.

---

## Entry 6 — 2026-10-23 — Deadlock prevention in transfers

**What I asked**: How do you prevent deadlocks when two concurrent transfers lock the same two accounts in opposite order?

**What the tool produced**: An explanation of lock ordering — always acquire locks in the same order (by account ID) to prevent circular waits.

**What was wrong**: The tool's initial transfer code locked `fromAccount` first, then `toAccount`. If two transfers run concurrently in opposite directions (A→B and B→A), each holds one lock and waits for the other — classic deadlock.

**What I did instead**: Changed `TransactionService.transfer()` to always lock the account with the lower ID first, regardless of which is `from` and which is `to`. This is the standard lock-ordering solution. Documented in THREATS.md threat #5.

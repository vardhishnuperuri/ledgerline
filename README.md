# LedgerLine

A secure banking ledger application with role-based access control, account onboarding workflows, and a full audit trail.

**Live demo**: https://ledgerline-ten-tau.vercel.app

---

## What it does

- Account holders register, request accounts (PENDING), and wait for admin approval
- Admins approve or reject account requests, manage users, and view the audit log
- Auditors have read-only access to all accounts and the audit trail
- Every sensitive action (login, transfer, approval, rejection) is recorded in an append-only audit log
- Transfers use pessimistic locking and idempotency keys to prevent double-spend and race conditions

---

## Roles

| Role | Can do |
|------|--------|
| ADMIN | Approve/reject accounts, create users, deposit funds, view all accounts, view audit log |
| ACCOUNT_HOLDER | Request accounts, withdraw, transfer between own accounts, view own statements |
| AUDITOR | Read-only access to all accounts and audit log |

---

## Demo credentials

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@LedgerLine1 | ADMIN |
| alice | test123 | ACCOUNT_HOLDER |
| bob | test123 | ACCOUNT_HOLDER |
| auditor | test123 | AUDITOR |

---

## Run locally

### Prerequisites
- Java 21
- Maven 3.9+
- PostgreSQL 14+
- Node.js 20+

### Backend

```bash
# Create database
psql -U postgres -c "CREATE DATABASE ledgerline_db;"

# Start backend
cd CRUD
set DB_PASSWORD=your_postgres_password
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Run with Docker

```bash
# Copy and edit environment variables
cp .env.example .env

# Start everything
docker-compose up --build
```

App available at `http://localhost:80`

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_PASSWORD | changeme | PostgreSQL password |
| JWT_SECRET | (insecure default) | JWT signing secret — **change in production** |
| ADMIN_USERNAME | admin | Bootstrap admin username |
| ADMIN_PASSWORD | Admin@LedgerLine1 | Bootstrap admin password |
| ADMIN_EMAIL | admin@ledgerline.com | Bootstrap admin email |

---

## Run tests

```bash
cd CRUD
mvn test -Dspring.profiles.active=test
```

Tests use H2 in-memory database — no PostgreSQL required.

**14 tests** covering:
- Register and login flow
- Wrong password rejection
- Duplicate username rejection
- Unauthenticated access returns 401
- Account holder blocked from admin endpoints (403)
- Account request creates PENDING account
- Admin can approve/reject pending accounts
- Regular user cannot approve accounts (403)
- Deposit on PENDING account is blocked

---

## API endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | None | Register new account holder |
| POST | /api/auth/login | None | Login, returns JWT |
| POST | /api/auth/users | ADMIN | Create user with any role |
| GET | /api/auth/users | ADMIN | List all users |

### Accounts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/accounts/request | ACCOUNT_HOLDER, ADMIN | Submit account request |
| GET | /api/accounts | ACCOUNT_HOLDER, ADMIN | My accounts |
| GET | /api/accounts/all | ADMIN, AUDITOR | All accounts |
| GET | /api/accounts/pending | ADMIN | Pending requests |
| POST | /api/accounts/{id}/approve | ADMIN | Approve request |
| POST | /api/accounts/{id}/reject | ADMIN | Reject request |

### Transactions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/transactions/deposit | ADMIN | Deposit into account |
| POST | /api/transactions/withdraw | ACCOUNT_HOLDER, ADMIN | Withdraw from own account |
| POST | /api/transactions/transfer | ACCOUNT_HOLDER, ADMIN | Transfer between accounts |
| GET | /api/transactions/statement/{accountId} | Owner, ADMIN, AUDITOR | Account statement |

### Audit
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/audit | ADMIN, AUDITOR | All audit events |
| GET | /api/audit/{entityType}/{entityId} | ADMIN, AUDITOR | Events for entity |

---

## Architecture

```
frontend/          React + Vite SPA
CRUD/              Spring Boot backend
  config/          DataSeeder (bootstrap admin + demo users)
  controller/      REST endpoints
  service/         Business logic + audit logging
  entity/          JPA entities (User, Account, Transaction, AuditLog)
  security/        JWT filter, SecurityConfig
  exception/       Global error handler
  db/migration/    Flyway SQL migrations (V1, V2, V3)
```

---

## Security design

See [THREATS.md](THREATS.md) for the full threat model.

Key decisions:
- All authorisation enforced server-side with `@PreAuthorize` — frontend role checks are UI-only
- Pessimistic row locking on transfers, accounts locked in ID order to prevent deadlocks
- Idempotency keys prevent duplicate transactions on network retry
- Audit log is append-only — no delete or update endpoints exposed
- BCrypt password hashing, JWT with configurable expiry
- Transactions blocked on non-ACTIVE accounts

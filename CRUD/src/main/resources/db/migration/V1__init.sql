-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'ACCOUNT_HOLDER', 'AUDITOR')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Accounts table
CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance NUMERIC(19,4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT balance_non_negative CHECK (balance >= 0)
);

-- Transactions table (double-entry: every transfer = 2 rows)
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    from_account_id BIGINT REFERENCES accounts(id),
    to_account_id BIGINT REFERENCES accounts(id),
    amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit log (append-only)
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    detail TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed: users (password: password123 — corrected at startup by DataSeeder)
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2a$10$placeholder.hash.will.be.fixed.by.DataSeeder.on.startup', 'admin@ledgerline.com', 'ADMIN'),
('auditor', '$2a$10$placeholder.hash.will.be.fixed.by.DataSeeder.on.startup', 'auditor@ledgerline.com', 'AUDITOR'),
('alice', '$2a$10$placeholder.hash.will.be.fixed.by.DataSeeder.on.startup', 'alice@ledgerline.com', 'ACCOUNT_HOLDER'),
('bob', '$2a$10$placeholder.hash.will.be.fixed.by.DataSeeder.on.startup', 'bob@ledgerline.com', 'ACCOUNT_HOLDER');

-- Seed: accounts
INSERT INTO accounts (owner_id, account_number, balance, currency) VALUES
(3, 'ACC-ALICE-001', 5000.0000, 'USD'),
(4, 'ACC-BOB-001', 3000.0000, 'USD');

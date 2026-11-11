-- Add status and account_type to accounts
ALTER TABLE accounts ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED'));
ALTER TABLE accounts ADD COLUMN account_type VARCHAR(20) NOT NULL DEFAULT 'PERSONAL'
    CHECK (account_type IN ('PERSONAL', 'BUSINESS', 'SAVINGS'));

-- Existing accounts are already active
UPDATE accounts SET status = 'ACTIVE';

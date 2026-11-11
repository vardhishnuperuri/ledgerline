-- Remove fake seed data — real users will register through the app
-- Admin will be bootstrapped by DataSeeder on first startup if no admin exists

DELETE FROM audit_log;
DELETE FROM transactions;
DELETE FROM accounts;
DELETE FROM users;

-- Reset sequences so IDs start from 1
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE accounts_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_log_id_seq RESTART WITH 1;

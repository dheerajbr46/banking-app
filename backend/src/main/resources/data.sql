INSERT INTO users (id, username, password, email, role) VALUES
  (1, 'avery', 'password123', 'avery@example.com', 'ROLE_USER'),
  (2, 'morgan', 'password123', 'morgan@example.com', 'ROLE_USER');

INSERT INTO accounts (id, account_number, balance, type, user_id) VALUES
  (1, 'ACC-001', 3250.75, 'CHECKING', 1),
  (2, 'ACC-002', 8200.00, 'SAVINGS', 1),
  (3, 'ACC-003', 15000.50, 'INVESTMENT', 2);

INSERT INTO transactions (id, amount, type, timestamp, account_id) VALUES
  (1, 1250.00, 'DEPOSIT', '2025-11-10T09:15:00Z', 1),
  (2, 75.25, 'DEBIT', '2025-11-11T13:45:00Z', 1),
  (3, 500.00, 'TRANSFER', '2025-11-11T17:00:00Z', 2),
  (4, 1200.00, 'DEPOSIT', '2025-11-09T08:25:00Z', 3);

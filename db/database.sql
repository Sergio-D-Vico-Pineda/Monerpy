-- Money Manager Database Schema with Inline Comments

-- 1. Users
-- Stores user credentials and roles
CREATE TABLE users (
    id SERIAL PRIMARY KEY, -- unique identifier for each user
    username VARCHAR(255) UNIQUE NOT NULL, -- must be unique, used for login
    password_hash VARCHAR(255) NOT NULL, -- securely stores the hashed password
    email VARCHAR(255) UNIQUE, -- optional, must be unique if provided
    role VARCHAR(50) DEFAULT 'user', -- defines role, e.g., 'user' or 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- timestamp of user creation
    deleted_at TIMESTAMP NULL, -- soft delete timestamp, NULL if not deleted
);

-- 2. Transaction Groups
-- Logical groups for organizing related transactions (e.g., 'Vacation 2025')
CREATE TABLE transaction_groups (
    id SERIAL PRIMARY KEY, -- unique ID
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE, -- group owner
    name VARCHAR(255) NOT NULL, -- name of the group
    description TEXT, -- optional description
    type VARCHAR(50) CHECK (type IN ('income', 'expense')), -- restrict type
    soft_deleted BOOLEAN DEFAULT FALSE, -- used for hiding without deletion
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- creation time
);

-- 4. Transactions
-- Records actual financial activities
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY, -- unique ID
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE, -- owner
    amount NUMERIC(12, 2) NOT NULL, -- transaction value in EUR
    type VARCHAR(50) CHECK (type IN ('income', 'expense')), -- identifies the type
    group_id INTEGER REFERENCES transaction_groups (id), -- optional group link
    description TEXT, -- details about the transaction
    transaction_date DATE NOT NULL, -- when the transaction occurred
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- when it was recorded
    soft_deleted BOOLEAN DEFAULT FALSE -- allows hiding the transaction
);

-- 5. Recurring Transactions
-- Represents repeated transactions (e.g., rent, salary)
CREATE TABLE recurring_transactions (
    id SERIAL PRIMARY KEY, -- unique ID
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE, -- owner
    amount NUMERIC(12, 2) NOT NULL, -- recurring amount
    type VARCHAR(50) CHECK (type IN ('income', 'expense')), -- income or expense
    group_id INTEGER REFERENCES transaction_groups (id), -- optional group
    description TEXT, -- recurring transaction description
    start_date DATE NOT NULL, -- first occurrence date
    recurrence_rule TEXT NOT NULL, -- recurrence pattern (e.g., 'monthly')
    next_occurrence DATE NOT NULL, -- when the next instance should be generated
    active BOOLEAN DEFAULT TRUE, -- whether it's active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- creation time
);

-- 6. Audit Logs (for undo)
-- Tracks changes to records for auditing and undo purposes
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY, -- unique ID
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE, -- user who performed the action
    action VARCHAR(50) NOT NULL, -- type of action: create, update, delete
    table_name VARCHAR(50) NOT NULL, -- table affected
    record_id INTEGER NOT NULL, -- affected record ID
    previous_state JSONB, -- original state before change
    new_state JSONB, -- updated state after change
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- when the action occurred
);

-- 7. Imports
-- Stores metadata for CSV or file imports
CREATE TABLE imports (
    id SERIAL PRIMARY KEY, -- unique ID
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE, -- owner of the import
    filename VARCHAR(255), -- name of the imported file
    mapping JSONB, -- mapping of columns to fields
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- time of import
);

-- 8. Deleted Records (for full undo)
-- Keeps deleted data for recovery purposes
CREATE TABLE deleted_records (
    id SERIAL PRIMARY KEY, -- unique ID
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE, -- user who deleted
    table_name VARCHAR(50) NOT NULL, -- from which table
    record_id INTEGER NOT NULL, -- ID of deleted record
    record_data JSONB NOT NULL, -- full record content
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- time of deletion
);
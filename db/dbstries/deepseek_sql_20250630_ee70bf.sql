CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- e.g., "Checking", "Savings"
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.0,
    currency VARCHAR(3) DEFAULT 'EUR'
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT unique_user_category UNIQUE (user_id, name)  -- Prevent duplicate names per user
);

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT unique_user_tag UNIQUE (user_id, name)  -- Prevent duplicate tags per user
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    payee VARCHAR(100),  -- e.g., "Amazon", "Grocery Store"
    description TEXT,
    is_recurring BOOLEAN DEFAULT FALSE
);

-- Handles split transactions (groups of expenses/incomes)
CREATE TABLE splits (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,  -- Signed: negative = expense, positive = income
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
);

-- Links tags to splits (supports multiple tags per split)
CREATE TABLE split_tags (
    split_id INTEGER REFERENCES splits(id) ON DELETE CASCADE NOT NULL,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (split_id, tag_id)  -- Ensures unique tag assignments per split
);

-- Tracks recurring transaction templates
CREATE TABLE recurring_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    frequency VARCHAR(20) NOT NULL,  -- e.g., 'MONTHLY', 'WEEKLY'
    next_occurrence DATE NOT NULL
);

-- Logs imported CSV files to prevent duplicate imports
CREATE TABLE imported_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,  -- SHA256 hash of file content
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_file_hash UNIQUE (file_hash)  -- Prevent re-importing same file
);
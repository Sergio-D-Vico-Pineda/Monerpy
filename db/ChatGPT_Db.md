## 🧱 PASO 1: Tabla `families`

Representa un grupo de usuarios que comparten cuentas, categorías, etiquetas, etc.

```sql
CREATE TABLE families (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
```

* `id`: entero autoincremental como clave primaria.
* `deleted_at`: para soft delete.
* Timestamps (`created_at`, `updated_at`) como texto en formato ISO 8601.

---

## 🧱 PASO 2: Tabla `users`

Usuarios individuales, asociados a una familia.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

* `email` debe ser único.
* Se usa `password_hash` en lugar de `password_digest` para generalizar.
* Eliminar una familia elimina a sus usuarios.

---

## 🧱 PASO 3: Tabla `accounts`

Cada familia puede tener varias cuentas (efectivo, banco, inversión, préstamo, etc.). Incluye tipo, saldo persistente y color.

```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Ej: "checking", "cash", "loan", "investment"
  balance REAL NOT NULL DEFAULT 0.0, -- Saldo actual
  color TEXT NOT NULL DEFAULT '#6172F3', -- Hex string
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

* `type` será validado por la app (texto libre pero restringido lógicamente).
* `balance` es persistente, no calculado.
* `color` por defecto azul (`#6172F3`), personalizable.

---

## 🧱 PASO 4: Tabla `account_balances`

Registra el historial diario de saldos por cuenta.

```sql
CREATE TABLE account_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  balance REAL NOT NULL,
  cash_balance REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE (account_id, date)
);
```

* Guarda el `balance` total y el `cash_balance` opcional.
* Una fila por día y cuenta (restricción única).

---

## 🧱 PASO 5: Tabla `categories`

Categorías jerárquicas, asociadas a una familia. Pueden tener subcategorías mediante `parent_id`.

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6172F3',
  parent_id INTEGER, -- para subcategorías
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

* Una categoría puede tener una `parent_id` para modelar jerarquía.
* `parent_id` es opcional, y si se elimina la categoría padre, se limpia (`SET NULL`).

---

## 🧱 PASO 6: Tabla `tags`

Etiquetas reutilizables definidas por familia. Se usarán para marcar transacciones libremente.

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#e99537',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

* Las etiquetas están vinculadas a una familia, no a un usuario individual.
* El color por defecto es naranja (`#e99537`).

---

## 🧱 PASO 7: Tabla intermedia `transaction_tags`

Relaciona muchas etiquetas con muchas transacciones.

```sql
CREATE TABLE transaction_tags (
  transaction_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (transaction_id, tag_id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

* Clave primaria compuesta.
* Al eliminar una transacción o etiqueta, se eliminan las relaciones asociadas.

---

## 🧱 PASO 5: Tabla `categories`

Categorías jerárquicas, asociadas a una familia. Pueden tener subcategorías mediante `parent_id`.

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6172F3',
  parent_id INTEGER, -- para subcategorías
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

* Una categoría puede tener una `parent_id` para modelar jerarquía.
* `parent_id` es opcional, y si se elimina la categoría padre, se limpia (`SET NULL`).

---

## 🧱 PASO 6: Tabla `tags`

Etiquetas reutilizables definidas por familia. Se usarán para marcar transacciones libremente.

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#e99537',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

* Las etiquetas están vinculadas a una familia, no a un usuario individual.
* El color por defecto es naranja (`#e99537`).

---

## 🧱 PASO 7: Tabla intermedia `transaction_tags`

Relaciona muchas etiquetas con muchas transacciones.

```sql
CREATE TABLE transaction_tags (
  transaction_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (transaction_id, tag_id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

* Clave primaria compuesta.
* Al eliminar una transacción o etiqueta, se eliminan las relaciones asociadas.

---

## 🧱 PASO 8: Tabla `transactions`

Registra cada ingreso, gasto, inversión o préstamo. Asociada a cuenta, usuario, categoría y múltiples etiquetas.

```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  category_id INTEGER,
  transaction_date TEXT NOT NULL, -- YYYY-MM-DD
  description TEXT NOT NULL,
  amount REAL NOT NULL, -- positivo en todos los casos
  type TEXT NOT NULL, -- "income", "expense", "investment_buy", etc.
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

### Notas:

* `amount`: siempre positivo. El tipo define si es ingreso o gasto.
* `description`: obligatorio.
* `type`: restringido lógicamente desde la aplicación (`income`, `expense`, `investment_buy`, `investment_sell`, `loan_drawdown`, `loan_repayment`).

---

## 🧱 PASO 9: Tabla `recurring_transactions`

Define reglas para generar transacciones automáticas.

```sql
CREATE TABLE recurring_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  category_id INTEGER,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  frequency TEXT NOT NULL, -- "daily", "weekly", "monthly", "yearly"
  day_of_month INTEGER,    -- para frecuencia mensual/anual
  day_of_week INTEGER,     -- 0 (domingo) a 6 (sábado) para semanal
  time_of_day TEXT,        -- "HH:MM" (24h)
  start_date TEXT NOT NULL,
  end_date TEXT,
  max_occurrences INTEGER,
  occurrences_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

### Notas:

* Soporta fin por **fecha** (`end_date`) o por **número máximo de repeticiones** (`max_occurrences`).
* Campos condicionales:

  * `day_of_month` se usa para mensual o anual.
  * `day_of_week` para semanal.
  * `time_of_day` define la hora exacta.

---

## 🧱 PASO 10: Tabla `recurring_transaction_logs`

Registro de cuándo se ejecutó una transacción recurrente (útil para auditoría o debugging).

```sql
CREATE TABLE recurring_transaction_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recurring_transaction_id INTEGER NOT NULL,
  generated_transaction_id INTEGER, -- transacción real creada (opcional)
  execution_time TEXT NOT NULL, -- timestamp ISO8601
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);
```

* Guarda cuándo se ejecutó una recurrencia y qué transacción creó (si aplica).
* `execution_time` permite saber si el cron o trigger se ejecutó como estaba previsto.

## 🔍 ÍNDICES RECOMENDADOS

```sql
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_email ON users(email); -- ya está UNIQUE, esto es redundante pero común

CREATE INDEX idx_accounts_family_id ON accounts(family_id);
CREATE INDEX idx_accounts_type ON accounts(type);

CREATE INDEX idx_account_balances_account_id_date ON account_balances(account_id, date DESC);

CREATE INDEX idx_categories_family_id ON categories(family_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

CREATE INDEX idx_tags_family_id ON tags(family_id);

CREATE INDEX idx_transactions_account_id_date ON transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_deleted_at ON transactions(deleted_at);

CREATE INDEX idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX idx_transaction_tags_tag_id ON transaction_tags(tag_id);

CREATE INDEX idx_recurring_transactions_account_id ON recurring_transactions(account_id);
CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_type ON recurring_transactions(type);

CREATE INDEX idx_recurring_logs_recurring_id ON recurring_transaction_logs(recurring_transaction_id);
CREATE INDEX idx_recurring_logs_generated_id ON recurring_transaction_logs(generated_transaction_id);
```



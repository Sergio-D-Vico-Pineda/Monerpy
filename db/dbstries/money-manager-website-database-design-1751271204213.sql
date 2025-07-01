-- Migrations will appear here as you chat with AI

create table tags (
  id bigint primary key generated always as identity,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  created_at timestamp with time zone default now()
);

create table users (
  id bigint primary key generated always as identity,
  name text not null,
  email text not null unique,
  password text not null,
  created_at timestamp with time zone default now()
);

create table transactions (
  id bigint primary key generated always as identity,
  user_id bigint references users (id),
  date date not null,
  amount numeric(10, 2) not null,
  description text,
  tag_id bigint references tags (id),
  group_id bigint references transaction_groups (id),
  is_deleted boolean default false,
  created_at timestamp with time zone default now()
);

create table reports (
  id bigint primary key generated always as identity,
  user_id bigint references users (id),
  report_type text not null,
  generated_at timestamp with time zone default now(),
  content text
);

create table transaction_groups (
  id bigint primary key generated always as identity,
  name text not null,
  type text check (type in ('income', 'expense')) not null
);

create table audit_logs (
  id bigint primary key generated always as identity,
  user_id bigint references users (id),
  action text not null,
  table_name text not null,
  record_id bigint,
  changes jsonb,
  "timestamp" timestamp with time zone default now(),
  previous_state jsonb
);

create table recurring_transactions (
  id bigint primary key generated always as identity,
  user_id bigint references users (id),
  amount numeric(10, 2) not null,
  description text,
  frequency text check (
    frequency in ('daily', 'weekly', 'monthly', 'yearly')
  ) not null,
  start_date date not null,
  end_date date,
  group_id bigint references transaction_groups (id),
  tag_id bigint references tags (id),
  created_at timestamp with time zone default now()
);
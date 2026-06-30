-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "http";

-- Users table
create table if not exists users (
  id uuid primary key default auth.uid(),
  email text unique not null,
  full_name text,
  subscription_status text default 'free' check (subscription_status in ('free', 'active', 'cancelled')),
  subscription_start_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  stripe_customer_id text unique,
  assessment_count int default 0,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Assessments table
create table if not exists assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  assessment_name text not null,
  status text default 'draft' check (status in ('draft', 'completed')),
  controls_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- Templates table (pre-built library)
create table if not exists templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  domain text,
  controls_included text[] default array[]::text[],
  price decimal default 10.00,
  excel_file_url text,
  pdf_file_url text,
  word_file_url text,
  created_by uuid references users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Template purchases (audit trail)
create table if not exists template_purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  template_id uuid not null references templates(id),
  stripe_payment_id text unique,
  amount decimal not null,
  purchased_at timestamp with time zone default now()
);

-- Subscriptions table
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade unique,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text default 'active' check (status in ('active', 'cancelled', 'paused')),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  cancelled_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- Payments table (audit trail)
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  stripe_payment_id text unique not null,
  amount decimal not null,
  currency text default 'USD',
  type text check (type in ('subscription', 'template', 'refund')),
  status text default 'succeeded' check (status in ('succeeded', 'failed', 'pending')),
  description text,
  created_at timestamp with time zone default now()
);

-- Create indexes for performance
create index idx_assessments_user_id on assessments(user_id);
create index idx_assessments_created_at on assessments(created_at);
create index idx_template_purchases_user_id on template_purchases(user_id);
create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_stripe_id on subscriptions(stripe_subscription_id);
create index idx_payments_user_id on payments(user_id);
create index idx_payments_created_at on payments(created_at);

-- Enable RLS
alter table users enable row level security;
alter table assessments enable row level security;
alter table templates enable row level security;
alter table template_purchases enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to tables
create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();
  
create trigger update_assessments_updated_at before update on assessments
  for each row execute function update_updated_at_column();
  
create trigger update_templates_updated_at before update on templates
  for each row execute function update_updated_at_column();
  
create trigger update_subscriptions_updated_at before update on subscriptions
  for each row execute function update_updated_at_column();

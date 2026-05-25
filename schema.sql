-- Run this in your Supabase SQL editor

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_type TEXT,
  rate DECIMAL(10,2),
  payment_schedule TEXT CHECK (payment_schedule IN ('monthly', 'per_session', 'package')) DEFAULT 'per_session',
  last_reminded_date DATE,
  notes TEXT,
  reminders_enabled BOOLEAN DEFAULT false,
  reminder_days_after_due INTEGER DEFAULT 3,
  reminder_template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  amount DECIMAL(10,2),
  status TEXT CHECK (status IN ('unpaid', 'paid')) DEFAULT 'unpaid',
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  paid_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "providers_own_clients"
  ON clients FOR ALL
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "providers_own_sessions"
  ON sessions FOR ALL
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "providers_own_payment_history"
  ON payment_history FOR ALL
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

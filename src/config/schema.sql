-- ============================================
-- BloodConnect Ops - Supabase Schema
-- Run this in your Supabase SQL Editor
-- (Supabase Dashboard > SQL Editor > New Query)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (linked to Firebase Auth UID)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,  -- Firebase UID
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'city_manager', 'helpline', 'hr_manager', 'volunteer')),
  phone TEXT,
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOLUNTEERS
-- ============================================
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  assigned_city_manager_id TEXT REFERENCES profiles(id),
  tasks_completed INT DEFAULT 0,
  points INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DONORS
-- ============================================
CREATE TABLE IF NOT EXISTS donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  age INT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  last_donation_date TIMESTAMPTZ,
  total_donations INT DEFAULT 0,
  is_eligible BOOLEAN DEFAULT true,
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HELPLINE CALLS
-- ============================================
CREATE TABLE IF NOT EXISTS helpline_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_name TEXT NOT NULL,
  caller_phone TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('blood_request', 'donor_inquiry', 'volunteer_inquiry', 'complaint', 'emergency', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'escalated', 'closed')),
  blood_group_needed TEXT,
  units_needed INT,
  hospital TEXT,
  notes TEXT,
  assigned_to TEXT REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'other' CHECK (type IN ('blood_delivery', 'donor_visit', 'event_setup', 'awareness_drive', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES volunteers(id),
  assigned_by TEXT REFERENCES profiles(id),
  location TEXT,
  city TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  points_reward INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF
-- ============================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'city_manager', 'helpline', 'hr_manager', 'volunteer')),
  department TEXT NOT NULL,
  city TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BLOOD EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS blood_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'other' CHECK (event_type IN ('blood_drive', 'awareness_camp', 'volunteer_meetup', 'training', 'other')),
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  organizer_id TEXT REFERENCES profiles(id),
  max_participants INT,
  registered_count INT DEFAULT 0,
  units_collected INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_volunteers_city ON volunteers(city);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_city ON donors(city);
CREATE INDEX IF NOT EXISTS idx_helpline_calls_status ON helpline_calls(status);
CREATE INDEX IF NOT EXISTS idx_helpline_calls_priority ON helpline_calls(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_blood_events_date ON blood_events(date);
CREATE INDEX IF NOT EXISTS idx_blood_events_city ON blood_events(city);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_helpline_calls_updated_at BEFORE UPDATE ON helpline_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blood_events_updated_at BEFORE UPDATE ON blood_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpline_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_events ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (the app handles role-based access)
CREATE POLICY "Allow all for authenticated" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON volunteers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON donors FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON helpline_calls FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON staff FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON blood_events FOR ALL USING (true);

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================
-- Insert a test admin profile (replace 'FIREBASE_UID' with actual UID after creating the user in Firebase)
-- INSERT INTO profiles (id, email, name, role) VALUES ('FIREBASE_UID', 'admin@test.com', 'Admin User', 'admin');

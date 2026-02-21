// Supabase Database Types
// These match the tables you should create in your Supabase project.
// Run the SQL in src/config/schema.sql in the Supabase SQL editor to create them.

export type UserRole = 'admin' | 'city_manager' | 'helpline' | 'hr_manager' | 'volunteer';

export interface Profile {
  id: string; // Firebase UID
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  blood_group: string;
  area: string;
  city: string;
  status: 'active' | 'inactive' | 'on_leave';
  assigned_city_manager_id?: string;
  tasks_completed: number;
  points: number;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface Donor {
  id: string;
  name: string;
  email?: string;
  phone: string;
  blood_group: string;
  age: number;
  address: string;
  city: string;
  last_donation_date?: string;
  total_donations: number;
  is_eligible: boolean;
  medical_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HelplineCall {
  id: string;
  caller_name: string;
  caller_phone: string;
  call_type: 'blood_request' | 'donor_inquiry' | 'volunteer_inquiry' | 'complaint' | 'emergency' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated' | 'closed';
  blood_group_needed?: string;
  units_needed?: number;
  hospital?: string;
  notes?: string;
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'blood_delivery' | 'donor_visit' | 'event_setup' | 'awareness_drive' | 'other';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string; // volunteer id
  assigned_by?: string; // profile id
  location?: string;
  city?: string;
  due_date?: string;
  completed_at?: string;
  points_reward: number;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  city?: string;
  status: 'active' | 'inactive' | 'on_leave';
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface BloodEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'blood_drive' | 'awareness_camp' | 'volunteer_meetup' | 'training' | 'other';
  location: string;
  city: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer_id: string;
  max_participants?: number;
  registered_count: number;
  units_collected?: number;
  created_at: string;
  updated_at: string;
}

// Supabase generated Database type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      volunteers: {
        Row: Volunteer;
        Insert: Omit<Volunteer, 'id' | 'created_at' | 'updated_at' | 'tasks_completed' | 'points'>;
        Update: Partial<Omit<Volunteer, 'id' | 'created_at'>>;
      };
      donors: {
        Row: Donor;
        Insert: Omit<Donor, 'id' | 'created_at' | 'updated_at' | 'total_donations'>;
        Update: Partial<Omit<Donor, 'id' | 'created_at'>>;
      };
      helpline_calls: {
        Row: HelplineCall;
        Insert: Omit<HelplineCall, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<HelplineCall, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
      staff: {
        Row: Staff;
        Insert: Omit<Staff, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Staff, 'id' | 'created_at'>>;
      };
      blood_events: {
        Row: BloodEvent;
        Insert: Omit<BloodEvent, 'id' | 'created_at' | 'updated_at' | 'registered_count'>;
        Update: Partial<Omit<BloodEvent, 'id' | 'created_at'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

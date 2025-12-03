// ====================================
// Supabase Database Types
// ====================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      entries: {
        Row: {
          id: string;
          date: string;
          content: string;
          mood: string;
          tags: string[];
          schedule: Json; // Added schedule column
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          content?: string;
          mood?: string;
          tags?: string[];
          schedule?: Json; // Added schedule column
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          content?: string;
          mood?: string;
          tags?: string[];
          schedule?: Json; // Added schedule column
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// ====================================
// Application Types
// ====================================
export type ScheduleCategory = 'research' | 'university' | 'work' | 'dev' | 'study' | 'reading' | 'hobby' | 'routine' | 'commute' | 'sleep' | 'other';

export interface ScheduleItem {
  id: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  title: string;
  description?: string;
  category: ScheduleCategory;
}

export interface DiaryEntry {
  id: string;
  date: string; // ISO YYYY-MM-DD
  title?: string; // Optional title field
  content: string;
  mood: string;
  tags: string[];
  schedule?: ScheduleItem[]; // Added schedule field
  created_at: string;
  updated_at: string;
}

export type EntryExportFormat = 'json' | 'markdown';

export interface CalendarDayStats {
  date: Date;
  hasEntry: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export type MoodType = 'excellent' | 'good' | 'normal' | 'bad' | 'terrible';

export interface MoodOption {
  value: MoodType;
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'excellent', emoji: '😆', label: '最高', color: 'text-emerald-600', bgColor: 'bg-emerald-50 hover:bg-emerald-100' },
  { value: 'good', emoji: '😊', label: '良い', color: 'text-teal-600', bgColor: 'bg-teal-50 hover:bg-teal-100' },
  { value: 'normal', emoji: '😶', label: '普通', color: 'text-gray-600', bgColor: 'bg-gray-50 hover:bg-gray-100' },
  { value: 'bad', emoji: '😞', label: '微妙', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100' },
  { value: 'terrible', emoji: '😫', label: '最悪', color: 'text-rose-600', bgColor: 'bg-rose-50 hover:bg-rose-100' },
];

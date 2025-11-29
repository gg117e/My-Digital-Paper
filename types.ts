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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          content?: string;
          mood?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          content?: string;
          mood?: string;
          tags?: string[];
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
export interface DiaryEntry {
  id: string;
  date: string; // ISO YYYY-MM-DD
  content: string;
  mood: string;
  tags: string[];
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

export type MoodType = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

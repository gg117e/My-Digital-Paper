export interface DiaryEntry {
  id: string;
  entry_date: string; // ISO YYYY-MM-DD
  title: string;
  content: string;
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
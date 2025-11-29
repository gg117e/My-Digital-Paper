import { DiaryEntry } from '../types';
import { supabase } from '../utils/supabase';

// This service now uses Supabase as the backend
// Falls back to localStorage if Supabase is not configured

const STORAGE_KEY = 'diary_entries_db';
const USE_SUPABASE = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// LocalStorage fallback functions
const getDb = (): Record<string, DiaryEntry> => {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

const saveDb = (db: Record<string, DiaryEntry>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const storageService = {
  async upsertEntry(entry: { date?: string; entry_date?: string; title?: string; content?: string; tags?: string[]; mood?: string }): Promise<DiaryEntry> {
    // Support both 'date' and 'entry_date' field names
    const dateField = entry.date || entry.entry_date || new Date().toISOString().split('T')[0];
    
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('entries')
        .upsert({
          date: dateField,
          content: entry.content || '',
          tags: entry.tags || [],
          mood: entry.mood || 'neutral',
        }, {
          onConflict: 'date'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }

      return data as DiaryEntry;
    } else {
      // LocalStorage fallback
      await new Promise(resolve => setTimeout(resolve, 300));
      const db = getDb();
      const existingId = Object.values(db).find(e => e.date === dateField)?.id;
      
      const now = new Date().toISOString();
      const id = existingId || crypto.randomUUID();

      const newEntry: DiaryEntry = {
        id,
        date: dateField,
        title: entry.title || '',
        content: entry.content || '',
        tags: entry.tags || [],
        mood: entry.mood || 'neutral',
        created_at: existingId ? db[existingId].created_at : now,
        updated_at: now,
      };

      db[id] = newEntry;
      saveDb(db);
      return newEntry;
    }
  },

  async getEntryByDate(dateStr: string): Promise<DiaryEntry | null> {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('date', dateStr)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Supabase get error:', error);
        return null;
      }

      return data as DiaryEntry | null;
    } else {
      await new Promise(resolve => setTimeout(resolve, 100));
      const db = getDb();
      return Object.values(db).find(e => e.date === dateStr) || null;
    }
  },

  async getEntriesByMonth(year: number, month: number): Promise<DiaryEntry[]> {
    if (USE_SUPABASE) {
      // month is 0-indexed in JS Date
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase getEntriesByMonth error:', error);
        return [];
      }

      return data as DiaryEntry[];
    } else {
      const db = getDb();
      return Object.values(db).filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }
  },

  async getOnThisDayEntries(month: number, day: number): Promise<DiaryEntry[]> {
    if (USE_SUPABASE) {
      // Get all entries and filter by month/day in memory (Supabase doesn't have easy month/day extraction)
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase getOnThisDayEntries error:', error);
        return [];
      }

      return (data as DiaryEntry[]).filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getDate() === day;
      });
    } else {
      const db = getDb();
      return Object.values(db).filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getDate() === day;
      }).sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async getRandomEntry(): Promise<DiaryEntry | null> {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .neq('content', '')
        .order('date', { ascending: false });

      if (error || !data || data.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex] as DiaryEntry;
    } else {
      const db = getDb();
      const values = Object.values(db).filter(e => e.content.trim().length > 0);
      if (values.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * values.length);
      return values[randomIndex];
    }
  },

  async getAllEntries(): Promise<DiaryEntry[]> {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Supabase getAllEntries error:', error);
        return [];
      }

      return data as DiaryEntry[];
    } else {
      const db = getDb();
      return Object.values(db).sort((a, b) => a.date.localeCompare(b.date));
    }
  },

  async searchEntries(query: string): Promise<DiaryEntry[]> {
    if (USE_SUPABASE) {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .or(`content.ilike.%${query}%,tags.cs.{${query}}`)
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase searchEntries error:', error);
        return [];
      }

      return data as DiaryEntry[];
    } else {
      const db = getDb();
      const lowerQ = query.toLowerCase();
      return Object.values(db).filter(e => 
        e.content.toLowerCase().includes(lowerQ) ||
        e.tags.some(t => t.toLowerCase().includes(lowerQ))
      ).sort((a, b) => b.date.localeCompare(a.date));
    }
  }
};

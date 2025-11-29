import { DiaryEntry } from '../types';

// This service mocks the backend behavior using LocalStorage so the app is usable immediately.
// In a real implementation, this would be replaced by Supabase client calls.

const STORAGE_KEY = 'diary_entries_db';

const getDb = (): Record<string, DiaryEntry> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

const saveDb = (db: Record<string, DiaryEntry>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const storageService = {
  async upsertEntry(entry: Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'>): Promise<DiaryEntry> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const db = getDb();
    const existingId = Object.values(db).find(e => e.entry_date === entry.entry_date)?.id;
    
    const now = new Date().toISOString();
    const id = existingId || crypto.randomUUID();

    const newEntry: DiaryEntry = {
      ...entry,
      id,
      created_at: existingId ? db[existingId].created_at : now,
      updated_at: now,
    };

    db[id] = newEntry;
    saveDb(db);
    return newEntry;
  },

  async getEntryByDate(dateStr: string): Promise<DiaryEntry | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const db = getDb();
    return Object.values(db).find(e => e.entry_date === dateStr) || null;
  },

  async getEntriesByMonth(year: number, month: number): Promise<DiaryEntry[]> {
    const db = getDb();
    // Month is 0-indexed in JS Date, but let's assume 1-indexed input for clarity or match JS
    return Object.values(db).filter(e => {
      const d = new Date(e.entry_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },

  async getOnThisDayEntries(month: number, day: number): Promise<DiaryEntry[]> {
    const db = getDb();
    return Object.values(db).filter(e => {
      const d = new Date(e.entry_date);
      // JS getMonth is 0-11. Input expects 0-11 to match date-fns behavior used in hooks
      return d.getMonth() === month && d.getDate() === day;
    }).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  },

  async getRandomEntry(): Promise<DiaryEntry | null> {
    const db = getDb();
    const values = Object.values(db).filter(e => e.content.trim().length > 0);
    if (values.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * values.length);
    return values[randomIndex];
  },

  async getAllEntries(): Promise<DiaryEntry[]> {
    const db = getDb();
    return Object.values(db).sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  },

  async searchEntries(query: string): Promise<DiaryEntry[]> {
    const db = getDb();
    const lowerQ = query.toLowerCase();
    return Object.values(db).filter(e => 
      e.content.toLowerCase().includes(lowerQ) || 
      e.title.toLowerCase().includes(lowerQ) ||
      e.tags.some(t => t.toLowerCase().includes(lowerQ))
    ).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }
};
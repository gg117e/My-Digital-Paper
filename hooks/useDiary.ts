import { useState, useCallback } from 'react';
import { DiaryEntry } from '../types';
import { storageService } from '../services/storageService';

export const useDiary = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getEntry = useCallback(async (date: string) => {
    setLoading(true);
    try {
      return await storageService.getEntryByDate(date);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveEntry = useCallback(async (date: string, title: string, content: string, tags: string[]) => {
    setSaving(true);
    try {
      // Don't save empty entries if they don't exist yet, but we rely on upsert logic
      const result = await storageService.upsertEntry({
        entry_date: date,
        title,
        content,
        tags
      });
      return result;
    } finally {
      setSaving(false);
    }
  }, []);

  const getReviewEntries = useCallback(async () => {
    const today = new Date();
    // month is 0-indexed
    const onThisDay = await storageService.getOnThisDayEntries(today.getMonth(), today.getDate());
    
    // Filter out today from "On this day" if it exists
    const pastEntries = onThisDay.filter(e => e.entry_date !== new Date().toISOString().split('T')[0]);

    let randomEntry: DiaryEntry | null = null;
    if (pastEntries.length < 3) {
      randomEntry = await storageService.getRandomEntry();
    }

    return { onThisDay: pastEntries, randomEntry };
  }, []);

  const exportAllEntries = useCallback(async (format: 'json' | 'markdown') => {
    setLoading(true);
    try {
      const entries = await storageService.getAllEntries();
      
      let content = '';
      let mimeType = '';
      let extension = '';

      if (format === 'json') {
        content = JSON.stringify(entries, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // Markdown format
        content = entries.map(e => (
          `# ${e.entry_date} ${e.title ? '- ' + e.title : ''}\n\n${e.content}\n\nTags: ${e.tags.join(', ')}\n\n---\n`
        )).join('\n');
        mimeType = 'text/markdown';
        extension = 'md';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diary_export_${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMonthData = useCallback(async (year: number, month: number) => {
    return await storageService.getEntriesByMonth(year, month);
  }, []);

  const search = useCallback(async (query: string) => {
    return await storageService.searchEntries(query);
  }, []);

  return {
    loading,
    saving,
    getEntry,
    saveEntry,
    getReviewEntries,
    exportAllEntries,
    getMonthData,
    search
  };
};
import React, { useState, useEffect, useRef } from 'react';
import { useDiary } from '../hooks/useDiary';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { Save, Hash, Check } from 'lucide-react';

interface Props {
  date: string;
}

export const Editor: React.FC<Props> = ({ date }) => {
  const { getEntry, saveEntry, saving } = useDiary();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounce logic
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      const entry = await getEntry(date);
      if (entry) {
        setContent(entry.content || '');
        setTags(entry.tags || []);
      } else {
        setContent('');
        setTags([]);
      }
      setInitialLoading(false);
    };
    load();
  }, [date, getEntry]);

  const handleSave = async (c: string, tg: string[]) => {
    await saveEntry(date, c, tg);
    setLastSaved(new Date());
  };

  const handleChange = (newContent: string, newTags: string[]) => {
    setContent(newContent);
    setTags(newTags);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      handleSave(newContent, newTags);
    }, 1000); // Auto-save after 1s inactivity
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTags = [...tags, tagInput.trim()];
      setTagInput('');
      handleChange(content, newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    handleChange(content, newTags);
  };

  if (initialLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white min-h-[80vh] rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 relative">
      {/* Status Indicator */}
      <div className="absolute top-4 right-8 text-xs text-gray-400 flex items-center gap-2">
        {saving ? (
          <span className="flex items-center gap-1"><Save size={12} className="animate-spin" /> Saving...</span>
        ) : lastSaved ? (
          <span className="flex items-center gap-1 text-green-600"><Check size={12} /> Saved {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2 items-center">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-full">
            <Hash size={12} />
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1">×</button>
          </span>
        ))}
        <div className="relative">
          <Hash size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="タグを追加..."
            className="pl-7 pr-3 py-1 bg-transparent text-sm focus:outline-none placeholder-gray-300 min-w-[100px]"
          />
        </div>
      </div>

      <AutoResizeTextarea
        value={content}
        onChange={(e) => handleChange(e.target.value, tags)}
        placeholder="今日はどんな1日でしたか？"
        className="w-full bg-transparent text-base leading-relaxed text-gray-700 placeholder-gray-300 focus:outline-none min-h-[300px]"
      />
    </div>
  );
};

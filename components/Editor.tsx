import React, { useState, useEffect, useRef } from 'react';
import { useDiary } from '../hooks/useDiary';
import { storageService } from '../services/storageService';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { MoodSelector } from './MoodSelector';
import { DayScheduleView } from './DayScheduleView';
import { ScheduleEditor } from './ScheduleEditor';
import { MoodType, ScheduleItem } from '../types';
import { Save, Hash, Check, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  date: string;
}

export const Editor: React.FC<Props> = ({ date }) => {
  const { getEntry, saveEntry, saving } = useDiary();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('normal');
  const [tags, setTags] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  // Schedule Editor State
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | undefined>(undefined);
  const [newItemStartTime, setNewItemStartTime] = useState<string | undefined>(undefined);
  const [newItemEndTime, setNewItemEndTime] = useState<string | undefined>(undefined);

  // Debounce logic
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      const entry = await getEntry(date);
      if (entry) {
        setTitle(entry.title || '');
        setContent(entry.content || '');
        setMood((entry.mood as MoodType) || 'normal');
        setTags(entry.tags || []);
        setSchedule(entry.schedule || []);
      } else {
        setTitle('');
        setContent('');
        setMood('normal');
        setTags([]);
        setSchedule([]);
      }
      
      // Load existing tags for autocomplete
      const allEntries = await storageService.getAllEntries();
      const uniqueTags = new Set<string>();
      allEntries.forEach(e => e.tags?.forEach(t => uniqueTags.add(t)));
      setExistingTags(Array.from(uniqueTags));

      setInitialLoading(false);
    };
    load();
  }, [date, getEntry]);

  const handleSave = async (t: string, c: string, m: MoodType, tg: string[], s: ScheduleItem[]) => {
    await saveEntry(date, t, c, tg, m, s);
    setLastSaved(new Date());
  };

  const handleChange = (newTitle: string, newContent: string, newMood: MoodType, newTags: string[], newSchedule: ScheduleItem[]) => {
    setTitle(newTitle);
    setContent(newContent);
    setMood(newMood);
    setTags(newTags);
    setSchedule(newSchedule);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      handleSave(newTitle, newContent, newMood, newTags, newSchedule);
    }, 1000); // Auto-save after 1s inactivity
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTags = [...tags, tagInput.trim()];
      setTagInput('');
      handleChange(title, content, mood, newTags, schedule);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    handleChange(title, content, mood, newTags, schedule);
  };

  // Schedule Handlers
  const handleScheduleAdd = (startTime: string, endTime?: string) => {
    setEditingItem(undefined);
    setNewItemStartTime(startTime);
    setNewItemEndTime(endTime);
    setIsScheduleEditorOpen(true);
  };

  const handleScheduleEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setNewItemStartTime(undefined);
    setNewItemEndTime(undefined);
    setIsScheduleEditorOpen(true);
  };

  const handleScheduleMove = (item: ScheduleItem, newStartTime: string, newEndTime: string) => {
    const updatedSchedule = schedule.map(s => 
      s.id === item.id ? { ...s, startTime: newStartTime, endTime: newEndTime } : s
    );
    handleChange(title, content, mood, tags, updatedSchedule);
  };

  const handleEditorSave = (item: ScheduleItem) => {
    let updatedSchedule;
    const existingIndex = schedule.findIndex(s => s.id === item.id);

    if (existingIndex >= 0) {
      updatedSchedule = schedule.map(s => s.id === item.id ? item : s);
    } else {
      updatedSchedule = [...schedule, item];
    }
    handleChange(title, content, mood, tags, updatedSchedule);
    setIsScheduleEditorOpen(false);
  };

  const handleEditorDelete = (id: string) => {
    const updatedSchedule = schedule.filter(s => s.id !== id);
    handleChange(title, content, mood, tags, updatedSchedule);
    setIsScheduleEditorOpen(false);
  };

  const suggestions = tagInput.trim() 
    ? existingTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
    : [];

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

      <AutoResizeTextarea
        value={title}
        onChange={(e) => handleChange(e.target.value, content, mood, tags, schedule)}
        placeholder="タイトル"
        className="w-full bg-transparent text-2xl font-bold text-gray-800 placeholder-gray-300 focus:outline-none mb-6"
      />

      <MoodSelector selectedMood={mood} onChange={(newMood) => handleChange(title, content, newMood, tags, schedule)} />

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
            onChange={(e) => {
                setTagInput(e.target.value);
                setShowSuggestions(true);
            }}
            onKeyDown={handleAddTag}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="タグを追加..."
            className="pl-7 pr-3 py-1 bg-transparent text-sm focus:outline-none placeholder-gray-300 min-w-[100px]"
          />
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-10 min-w-[150px] max-h-40 overflow-y-auto">
                {suggestions.map(tag => (
                    <button
                        key={tag}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        onClick={() => {
                            const newTags = [...tags, tag];
                            setTagInput('');
                            handleChange(title, content, mood, newTags, schedule);
                            setShowSuggestions(false);
                        }}
                    >
                        #{tag}
                    </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Toggle & View */}
      <div className="mb-6">
        <button 
            onClick={() => setShowSchedule(!showSchedule)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2"
        >
            <CalendarIcon size={16} />
            {showSchedule ? 'スケジュールを隠す' : 'スケジュールを表示'}
        </button>
        
        {showSchedule && (
            <div className="animate-in slide-in-from-top-2 duration-300 mb-6">
                <DayScheduleView 
                    schedule={schedule}
                    onAdd={handleScheduleAdd}
                    onEdit={handleScheduleEdit}
                    onMove={handleScheduleMove}
                    isToday={new Date().toISOString().split('T')[0] === date}
                />
            </div>
        )}
      </div>

      <AutoResizeTextarea
        value={content}
        onChange={(e) => handleChange(title, e.target.value, mood, tags, schedule)}
        placeholder="今日はどんな1日でしたか？"
        className="w-full bg-transparent text-base leading-relaxed text-gray-700 placeholder-gray-300 focus:outline-none min-h-[300px]"
      />

      {/* Schedule Editor Modal */}
      <ScheduleEditor
        isOpen={isScheduleEditorOpen}
        onClose={() => setIsScheduleEditorOpen(false)}
        onSave={handleEditorSave}
        onDelete={handleEditorDelete}
        initialData={editingItem}
        initialStartTime={newItemStartTime}
        initialEndTime={newItemEndTime}
      />
    </div>
  );
};

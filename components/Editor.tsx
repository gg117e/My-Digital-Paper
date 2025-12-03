import React, { useState, useEffect, useRef } from 'react';
import { useDiary } from '../hooks/useDiary';
import { storageService } from '../services/storageService';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { MoodSelector } from './MoodSelector';
import { DayScheduleView } from './DayScheduleView';
import { ScheduleEditor } from './ScheduleEditor';
import { DailyCircleChart } from './DailyCircleChart';
import { ScheduleListItem } from './ScheduleListItem';
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
  // Sleep quick inputs (bed/wake shown under mood)
  const [sleepBedTime, setSleepBedTime] = useState<string>('');
  const [sleepWakeTime, setSleepWakeTime] = useState<string>('');
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);
  
  // Schedule Editor State
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | undefined>(undefined);
  const [newItemStartTime, setNewItemStartTime] = useState<string | undefined>(undefined);
  const [newItemEndTime, setNewItemEndTime] = useState<string | undefined>(undefined);

  // Debounce logic
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDefaultSchedule = (): ScheduleItem[] => [
    { 
      id: crypto.randomUUID(), 
      startTime: '07:00', 
      endTime: '07:30', 
      title: '起床', 
      category: 'sleep', 
      description: 'おはようございます' 
    },
    { 
      id: crypto.randomUUID(), 
      startTime: '23:30', 
      endTime: '23:59', 
      title: '就寝', 
      category: 'sleep', 
      description: 'おやすみなさい' 
    },
  ];

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      const entry = await getEntry(date);
      if (entry) {
        setTitle(entry.title || '');
        setContent(entry.content || '');
        setMood((entry.mood as MoodType) || 'normal');
        setTags(entry.tags || []);
        // 既存のエントリでもスケジュールが空ならデフォルトを設定（過去のデータとの整合性を考慮しつつ、空なら入れる）
        // ただし、意図的に全削除した場合と区別がつかないため、
        // ここでは「entry.scheduleが存在しない（undefined/null）」場合のみデフォルトを入れるか、
        // あるいは空配列の場合も入れるか。
        // ユーザー体験としては、開いたときにデフォルトが入っている方が便利。
        setSchedule((entry.schedule && entry.schedule.length > 0) ? entry.schedule : getDefaultSchedule());
      } else {
        setTitle('');
        setContent('');
        setMood('normal');
        setTags([]);
        setSchedule(getDefaultSchedule());
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

  // Sync sleep inputs from schedule when schedule changes
  useEffect(() => {
    const sleepItems = schedule.filter(s => s.category === 'sleep');
    if (sleepItems.length === 0) {
      setSleepBedTime('');
      setSleepWakeTime('');
      return;
    }

    if (sleepItems.length === 1) {
      setSleepBedTime(sleepItems[0].startTime);
      setSleepWakeTime(sleepItems[0].endTime);
      return;
    }

    // Two or more: try to detect cross-midnight pair
    // Heuristic: pick the one with start >= 12:00 as bedtime, the one with start < 12:00 as wake segment
    const late = sleepItems.find(s => Number(s.startTime.split(':')[0]) >= 12) || sleepItems[0];
    const early = sleepItems.find(s => Number(s.startTime.split(':')[0]) < 12) || sleepItems[1] || sleepItems[0];
    setSleepBedTime(late.startTime);
    setSleepWakeTime(early.endTime);
  }, [schedule]);

  const updateSleepInSchedule = (bed: string, wake: string) => {
    // Remove existing sleep items
    let newSchedule = schedule.filter(s => s.category !== 'sleep');

    if (!bed || !wake) {
      handleChange(title, content, mood, tags, newSchedule);
      return;
    }

    // If bed <= wake, single segment; otherwise split across midnight
    const bedMinutes = Number(bed.split(':')[0]) * 60 + Number(bed.split(':')[1]);
    const wakeMinutes = Number(wake.split(':')[0]) * 60 + Number(wake.split(':')[1]);

    if (bedMinutes <= wakeMinutes) {
      newSchedule = [
        ...newSchedule,
        {
          id: crypto.randomUUID(),
          startTime: bed,
          endTime: wake,
          title: '睡眠',
          category: 'sleep',
          description: '',
        },
      ];
    } else {
      // bed -> 23:59 and 00:00 -> wake
      newSchedule = [
        ...newSchedule,
        {
          id: crypto.randomUUID(),
          startTime: bed,
          endTime: '23:59',
          title: '睡眠',
          category: 'sleep',
          description: '',
        },
        {
          id: crypto.randomUUID(),
          startTime: '00:00',
          endTime: wake,
          title: '睡眠',
          category: 'sleep',
          description: '',
        },
      ];
    }

    handleChange(title, content, mood, tags, newSchedule);
  };

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
    // Default to 1 hour or specified end time
    let end = endTime;
    if (!end) {
        const [h, m] = startTime.split(':').map(Number);
        const endH = (h + 1) % 24;
        end = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    
    const newItem: ScheduleItem = {
        id: crypto.randomUUID(),
        title: '新規予定',
        startTime,
        endTime: end,
        category: 'work', // default
        description: ''
    };
    
    const updatedSchedule = [...schedule, newItem];
    handleChange(title, content, mood, tags, updatedSchedule);
  };

  const handleScheduleUpdate = (item: ScheduleItem) => {
    const updatedSchedule = schedule.map(s => s.id === item.id ? item : s);
    handleChange(title, content, mood, tags, updatedSchedule);
  };

  const handleScheduleDelete = (id: string) => {
    const updatedSchedule = schedule.filter(s => s.id !== id);
    handleChange(title, content, mood, tags, updatedSchedule);
  };

  const handleScheduleEdit = (item: ScheduleItem) => {
    // Keep for modal if needed, but now we use inline
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

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <MoodSelector selectedMood={mood} onChange={(newMood) => handleChange(title, content, newMood, tags, schedule)} />

            <div className="mt-4 flex flex-wrap gap-2 items-center">
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

            {/* Sleep quick inputs */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <label className="text-sm text-gray-600">就寝</label>
              <input
                type="time"
                value={sleepBedTime}
                onChange={(e) => {
                  setSleepBedTime(e.target.value);
                  updateSleepInSchedule(e.target.value, sleepWakeTime);
                }}
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm"
              />

              <label className="text-sm text-gray-600">起床</label>
              <input
                type="time"
                value={sleepWakeTime}
                onChange={(e) => {
                  setSleepWakeTime(e.target.value);
                  updateSleepInSchedule(sleepBedTime, e.target.value);
                }}
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div className="w-full md:w-72 flex-shrink-0">
            <DailyCircleChart
              schedule={schedule}
              size={250}
              externalHoverId={hoveredSliceId}
              onSliceClick={(it) => {
                // Optional: Scroll to item in list or highlight
                // For now, just highlight
              }}
              onAddAt={(t) => handleScheduleAdd(t)}
              onSliceMove={handleScheduleMove}
            />

            <div className="mt-4 bg-white border border-gray-100 rounded-lg shadow-sm p-2">
              <div className="text-xs text-gray-500 font-medium mb-2 px-2">今日の予定</div>
              <ul className="text-sm text-gray-700">
                {schedule.slice().sort((a,b) => a.startTime.localeCompare(b.startTime)).map(item => (
                  <ScheduleListItem
                    key={item.id}
                    item={item}
                    onUpdate={handleScheduleUpdate}
                    onDelete={handleScheduleDelete}
                    onHover={setHoveredSliceId}
                  />
                ))}
              </ul>
            </div>
          </div>
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

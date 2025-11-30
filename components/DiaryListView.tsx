import React, { useEffect, useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { DiaryEntry } from '../types';
import { storageService } from '../services/storageService';
import { Tag, X } from 'lucide-react';

interface DiaryListViewProps {
  // onSelectDate is not used in the current implementation of HomePage, 
  // but keeping the interface clean or removing props if not needed.
  // The previous code used Link to /entry/:date, so we don't strictly need onSelectDate prop unless we want to change behavior.
  // I will keep using Link for navigation as it was before.
}

export const DiaryListView: React.FC<DiaryListViewProps> = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const loadEntries = async () => {
      const data = await storageService.getAllEntries();
      setEntries(data);
      setLoading(false);
    };
    loadEntries();
  }, []);

  // ムードIDから絵文字を取得するヘルパー
  const getMoodEmoji = (moodId: string) => {
    const moods: Record<string, string> = {
      'excellent': '😆',
      'good': '😊',
      'normal': '😶',
      'bad': '😞',
      'terrible': '😫'
    };
    return moods[moodId] || '😶';
  };

  // タグの集計
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });
    // カウントの多い順にソート
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [entries]);

  // フィルタリング
  const filteredEntries = entries.filter(entry => {
    const moodMatch = selectedMood ? entry.mood === selectedMood : true;
    const tagMatch = selectedTag ? entry.tags?.includes(selectedTag) : true;
    return moodMatch && tagMatch;
  });

  // 年月ごとにグループ化
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const monthKey = format(parseISO(entry.date), 'yyyy年 M月', { locale: ja });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
        <p>まだ日記がありません。</p>
        <p className="text-sm mt-2">カレンダーの日付をクリックして書いてみましょう！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 sticky top-20 z-20">
        {/* Mood Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 mr-1">Mood:</span>
          <button
            onClick={() => setSelectedMood(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              selectedMood === null
                ? 'bg-gray-800 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {[
            { id: 'excellent', emoji: '😆' },
            { id: 'good', emoji: '😊' },
            { id: 'normal', emoji: '😶' },
            { id: 'bad', emoji: '😞' },
            { id: 'terrible', emoji: '😫' },
          ].map((mood) => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition-all ${
                selectedMood === mood.id
                  ? 'bg-indigo-100 ring-2 ring-indigo-200 scale-110'
                  : 'bg-gray-50 hover:bg-gray-100 grayscale hover:grayscale-0'
              }`}
              title={mood.id}
            >
              {mood.emoji}
            </button>
          ))}
        </div>

        {/* Tag Filter */}
        {tagCounts.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-50">
            <div className="text-xs text-gray-400 flex items-center gap-1 mr-1">
              <Tag size={14} />
            </div>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                selectedTag === null
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {tagCounts.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 ${
                  selectedTag === tag
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>#{tag}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      {Object.keys(groupedEntries).length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p>条件に一致する日記が見つかりませんでした。</p>
          <button 
            onClick={() => { setSelectedMood(null); setSelectedTag(null); }}
            className="mt-2 text-indigo-600 hover:underline text-sm"
          >
            フィルターを解除
          </button>
        </div>
      ) : (
        Object.entries(groupedEntries).map(([month, monthEntries]) => (
          <div key={month} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-400 sticky top-[10.5rem] bg-gray-50/95 backdrop-blur-sm py-2 z-10 pl-2 border-l-4 border-indigo-100">
              {month}
            </h3>
            
            <div className="grid gap-4">
              {(monthEntries as DiaryEntry[]).map((entry) => (
                <Link 
                  key={entry.id}
                  to={`/entry/${entry.date}`}
                  className="group bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer flex gap-4 items-start"
                >
                  {/* 左側：日付 */}
                  <div className="flex flex-col items-center min-w-[3.5rem] pt-1">
                    <span className="text-2xl font-bold text-gray-700 leading-none">
                      {format(parseISO(entry.date), 'd')}
                    </span>
                    <span className="text-xs text-gray-400 font-medium mt-1">
                      {format(parseISO(entry.date), 'E', { locale: ja })}
                    </span>
                    <div className="mt-3 text-2xl" title="気分">
                      {getMoodEmoji(entry.mood)}
                    </div>
                  </div>

                  {/* 右側：内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-800 truncate pr-4 group-hover:text-indigo-600 transition-colors">
                        {entry.title || '無題'}
                      </h4>
                    </div>
                    
                    <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-2">
                      {entry.content || '(本文なし)'}
                    </p>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {entry.tags.map(tag => (
                          <span 
                            key={tag} 
                            className={`text-xs px-2 py-1 rounded-full ${
                              selectedTag === tag 
                                ? 'bg-indigo-100 text-indigo-700 font-medium' 
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

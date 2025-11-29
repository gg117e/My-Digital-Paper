import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { DiaryEntry } from '../types';
import { storageService } from '../services/storageService';

export const DiaryListView: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  // 年月ごとにグループ化
  const groupedEntries = entries.reduce((acc, entry) => {
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
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      {Object.entries(groupedEntries).map(([month, monthEntries]) => (
        <div key={month} className="space-y-4">
          <h3 className="text-lg font-bold text-gray-400 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
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
                        <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
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
      ))}
    </div>
  );
};

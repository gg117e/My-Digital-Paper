import React, { useState, useEffect, useRef } from 'react';
import { ScheduleItem } from '../types';
import { Trash2, Clock, Tag } from 'lucide-react';

interface ScheduleListItemProps {
  item: ScheduleItem;
  onUpdate: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
  onHover: (id: string | null) => void;
}

export const ScheduleListItem: React.FC<ScheduleListItemProps> = ({
  item,
  onUpdate,
  onDelete,
  onHover,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(item.title);
  
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(item.description || '');

  // Update temp state when item changes from outside (e.g. drag on chart)
  useEffect(() => {
    setTempTitle(item.title);
    setTempDescription(item.description || '');
  }, [item]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (tempTitle !== item.title) {
      onUpdate({ ...item, title: tempTitle });
    }
  };

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false);
    if (tempDescription !== (item.description || '')) {
      onUpdate({ ...item, description: tempDescription });
    }
  };

  const snapTimeStr = (timeStr: string) => {
    if (!timeStr) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = h * 60 + m;
    const snapped = Math.round(totalMinutes / 15) * 15;
    const newH = Math.floor(snapped / 60) % 24;
    const newM = snapped % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  const categories: { value: ScheduleItem['category']; label: string; color: string }[] = [
    { value: 'research', label: '研究', color: 'bg-purple-100 text-purple-700' },
    { value: 'university', label: '大学', color: 'bg-pink-100 text-pink-700' },
    { value: 'work', label: '仕事', color: 'bg-blue-100 text-blue-700' },
    { value: 'dev', label: '開発', color: 'bg-cyan-100 text-cyan-700' },
    { value: 'study', label: '学習', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'reading', label: '読書', color: 'bg-teal-100 text-teal-700' },
    { value: 'hobby', label: '趣味', color: 'bg-green-100 text-green-700' },
    { value: 'routine', label: '生活', color: 'bg-orange-100 text-orange-700' },
    { value: 'commute', label: '移動', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'sleep', label: '睡眠', color: 'bg-slate-100 text-slate-700' },
    { value: 'other', label: '他', color: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <li
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      className="py-3 px-2 flex flex-col gap-2 hover:bg-gray-50 rounded-lg group transition-colors border-b border-gray-50 last:border-0"
    >
      <div className="flex items-start gap-2 w-full">
        {/* Time Inputs */}
        <div className="flex flex-col gap-1 min-w-[4.5rem]">
          <input
            type="time"
            step="900"
            value={item.startTime}
            onChange={(e) => onUpdate({ ...item, startTime: e.target.value })}
            onBlur={(e) => onUpdate({ ...item, startTime: snapTimeStr(e.target.value) })}
            className="text-xs bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full text-gray-500 font-mono"
          />
          <input
            type="time"
            step="900"
            value={item.endTime}
            onChange={(e) => onUpdate({ ...item, endTime: e.target.value })}
            onBlur={(e) => onUpdate({ ...item, endTime: snapTimeStr(e.target.value) })}
            className="text-xs bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full text-gray-400 font-mono"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            {/* Title Inline Edit */}
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                  autoFocus
                  className="w-full text-sm font-medium bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none"
                />
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="text-sm font-medium text-gray-700 truncate cursor-text hover:text-blue-600 transition-colors"
                  title={item.title}
                >
                  {item.title || 'タイトルなし'}
                </div>
              )}
            </div>

            {/* Category Select */}
            <div className="relative flex-shrink-0">
              <select
                value={item.category}
                onChange={(e) => onUpdate({ ...item, category: e.target.value as ScheduleItem['category'] })}
                className={`appearance-none text-[10px] px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-200 ${
                  categories.find(c => c.value === item.category)?.color || 'bg-gray-100 text-gray-500'
                }`}
                style={{ maxWidth: '5rem' }}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description Inline Edit */}
          <div className="w-full">
            {isEditingDescription ? (
              <input
                type="text"
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleDescriptionBlur()}
                autoFocus
                className="w-full text-xs bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none"
                placeholder="詳細を入力..."
              />
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className={`text-xs px-1 py-0.5 rounded cursor-text min-h-[1.25rem] flex items-center truncate ${
                  !item.description ? 'text-gray-300 italic hover:bg-gray-100' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {item.description || '詳細を追加...'}
              </div>
            )}
          </div>
        </div>

        {/* Delete Button (Visible on Hover) */}
        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
          title="削除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
};

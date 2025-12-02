import React, { useState, useEffect } from 'react';
import { ScheduleItem } from '../types';
import { X, Clock, AlignLeft, Tag } from 'lucide-react';

interface ScheduleEditorProps {
  isOpen: boolean;
  initialData?: ScheduleItem; // Renamed from item
  initialStartTime?: string;
  initialEndTime?: string;
  onSave: (item: ScheduleItem) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  isOpen,
  initialData,
  initialStartTime,
  initialEndTime,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ScheduleItem['category']>('work');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setStartTime(initialData.startTime);
        setEndTime(initialData.endTime);
        setDescription(initialData.description || '');
        setCategory(initialData.category);
      } else {
        setTitle('');
        setStartTime(initialStartTime || '09:00');
        setEndTime(initialEndTime || '');
        setDescription('');
        setCategory('work');
        
        if (initialStartTime && !initialEndTime) {
           const [h, m] = initialStartTime.split(':').map(Number);
           const endH = h + 1;
           if (endH >= 24) {
             setEndTime('23:59');
           } else {
             setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
           }
        }
      }
    }
  }, [isOpen, initialData, initialStartTime, initialEndTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;

    onSave({
      id: initialData?.id || crypto.randomUUID(),
      title,
      startTime,
      endTime,
      description,
      category,
    });
    // onClose is handled by parent usually, but here we can call it if we want to be sure
    // But Editor.tsx calls setIsScheduleEditorOpen(false) in onSave.
    // However, for safety/UX, we can call onClose here too if onSave is async?
    // No, onSave in Editor.tsx is synchronous (it calls async saveEntry but returns void).
  };

  const categories: { value: ScheduleItem['category']; label: string; color: string }[] = [
    { value: 'work', label: '仕事/作業', color: 'bg-blue-100 text-blue-700 border-blue-500' },
    { value: 'study', label: '学習/勉強', color: 'bg-indigo-100 text-indigo-700 border-indigo-500' },
    { value: 'personal', label: '私用', color: 'bg-green-100 text-green-700 border-green-500' },
    { value: 'routine', label: '生活/ルーティン', color: 'bg-orange-100 text-orange-700 border-orange-500' },
    { value: 'sleep', label: '睡眠', color: 'bg-purple-100 text-purple-700 border-purple-500' },
    { value: 'urgent', label: '緊急', color: 'bg-red-100 text-red-700 border-red-500' },
    { value: 'other', label: 'その他', color: 'bg-gray-100 text-gray-700 border-gray-500' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{initialData ? '予定を編集' : '予定を追加'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを追加"
              className="w-full text-xl font-bold placeholder-gray-300 border-b-2 border-transparent focus:border-blue-500 focus:outline-none py-1 transition-colors"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-4">
            <Clock className="text-gray-400" size={20} />
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-gray-400">-</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <AlignLeft className="text-gray-400 mt-1" size={20} />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="感想やメモ..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px] resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <Tag className="text-gray-400" size={20} />
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    category === cat.value
                      ? cat.color
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('この予定を削除しますか？')) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="mr-auto text-red-500 text-sm hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                削除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

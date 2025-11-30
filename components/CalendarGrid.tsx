import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay 
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDiary } from '../hooks/useDiary';
import { DiaryEntry, MoodType } from '../types';

export const CalendarGrid: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const { getMonthData } = useDiary();

  useEffect(() => {
    const fetchEntries = async () => {
      const data = await getMonthData(currentDate.getFullYear(), currentDate.getMonth());
      setEntries(data);
    };
    fetchEntries();
  }, [currentDate, getMonthData]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Calculate empty slots for start of week (Sunday start)
  const startDayOfWeek = getDay(startOfMonth(currentDate));
  const emptySlots = Array(startDayOfWeek).fill(null);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800">
          {format(currentDate, 'yyyy年 M月', { locale: ja })}
        </h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {emptySlots.map((_, i) => <div key={`empty-${i}`} />)}
        
        {daysInMonth.map((day) => {
          const isoDate = format(day, 'yyyy-MM-dd');
          const entry = entries.find(e => e.date === isoDate);
          const hasEntry = !!entry;
          const isToday = isSameDay(day, new Date());
          
          // ムードに応じた色を設定
          const getMoodColor = (mood?: string) => {
            switch(mood as MoodType) {
              case 'excellent': return 'bg-emerald-500';
              case 'good': return 'bg-teal-500';
              case 'normal': return 'bg-gray-500';
              case 'bad': return 'bg-orange-500';
              case 'terrible': return 'bg-rose-500';
              default: return 'bg-blue-500';
            }
          };

          return (
            <Link
              key={isoDate}
              to={`/entry/${isoDate}`}
              className={`
                min-h-[80px] p-1.5 flex flex-col items-start justify-start rounded-lg relative transition-all border border-transparent
                ${isToday ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-700 hover:border-gray-200'}
              `}
            >
              <span className={`text-xs mb-1 ${isToday ? 'font-bold' : 'font-medium text-gray-400'}`}>
                {format(day, 'd')}
              </span>
              {hasEntry && (
                <div className="w-full flex flex-col gap-1">
                    <div className={`text-[10px] leading-tight line-clamp-3 break-all ${isToday ? 'text-gray-200' : 'text-gray-600'}`}>
                        {entry.title || entry.content?.slice(0, 30) || '無題'}
                    </div>
                    <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : getMoodColor(entry.mood)}`} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

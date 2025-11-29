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
import { DiaryEntry } from '../types';

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
          const hasEntry = entries.some(e => e.date === isoDate);
          const isToday = isSameDay(day, new Date());

          return (
            <Link
              key={isoDate}
              to={`/entry/${isoDate}`}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg relative transition-all
                ${isToday ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-700'}
              `}
            >
              <span className={`text-sm ${isToday ? 'font-bold' : 'font-normal'}`}>
                {format(day, 'd')}
              </span>
              {hasEntry && (
                <span className={`absolute bottom-2 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-blue-500'}`} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

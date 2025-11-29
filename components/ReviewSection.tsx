import React, { useEffect, useState } from 'react';
import { DiaryEntry } from '../types';
import { useDiary } from '../hooks/useDiary';
import { Link } from 'react-router-dom';
import { Sparkles, CalendarClock, ChevronRight } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { ja } from 'date-fns/locale';

export const ReviewSection: React.FC = () => {
  const { getReviewEntries } = useDiary();
  const [onThisDay, setOnThisDay] = useState<DiaryEntry[]>([]);
  const [random, setRandom] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      const data = await getReviewEntries();
      setOnThisDay(data.onThisDay);
      setRandom(data.randomEntry);
      setLoading(false);
    };
    fetchReview();
  }, [getReviewEntries]);

  if (loading) return <div className="h-32 animate-pulse bg-gray-100 rounded-lg mb-8"></div>;

  if (onThisDay.length === 0 && !random) return null;

  return (
    <div className="mb-10 space-y-6">
      <div className="flex items-center gap-2 text-muted text-sm font-medium uppercase tracking-wider">
        <Sparkles size={16} />
        <span>振り返り</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* On This Day Cards */}
        {onThisDay.slice(0, 2).map((entry) => {
          const yearsAgo = differenceInYears(new Date(), new Date(entry.date));
          return (
            <Link 
              key={entry.id} 
              to={`/entry/${entry.date}`}
              className="group block p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {yearsAgo}年前
                </span>
                <span className="text-xs text-gray-400">
                  {format(new Date(entry.date), 'yyyy年', { locale: ja })}
                </span>
              </div>
              <h3 className="font-medium text-gray-800 mb-1 line-clamp-1">
                {entry.title || format(new Date(entry.date), 'M月d日', { locale: ja })}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {entry.content || '...'}
              </p>
            </Link>
          );
        })}

        {/* Random Entry Card (if showing) */}
        {random && onThisDay.length < 2 && (
          <Link 
            to={`/entry/${random.date}`}
            className="group block p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
                <CalendarClock size={12} />
                過去の日記
              </span>
              <span className="text-xs text-gray-400">
                {format(new Date(random.date), 'yyyy/MM/dd')}
              </span>
            </div>
             <h3 className="font-medium text-gray-800 mb-1 line-clamp-1">
                {random.title || format(new Date(random.date), 'M月d日', { locale: ja })}
              </h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {random.content || '...'}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
};

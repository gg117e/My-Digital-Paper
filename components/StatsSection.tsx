import React, { useEffect, useState, useMemo } from 'react';
import { DiaryEntry, MOOD_OPTIONS } from '../types';
import { storageService } from '../services/storageService';
import { Flame, Calendar, Activity, History, ArrowRight, Sparkles } from 'lucide-react';
import { subDays, format, eachDayOfInterval, subYears, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const StatsSection: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await storageService.getAllEntries();
      setEntries(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    if (!entries || entries.length === 0) return null;

    const now = new Date();
    // タイムゾーンを考慮して日付文字列を生成
    const toDateStr = (d: Date) => format(d, 'yyyy-MM-dd');
    const todayStr = toDateStr(now);
    const entryDates = new Set(entries.map(e => e.date));

    // 1. Current Streak (連続記録日数)
    let streak = 0;
    let checkDate = now;
    
    // もし今日書いてなければ、昨日からチェック開始（昨日は書いている前提でストリーク計算）
    // 今日書いていれば今日からカウント
    if (!entryDates.has(todayStr)) {
        checkDate = subDays(now, 1);
    }

    // 過去に遡って連続しているかチェック
    while (true) {
      const dateStr = toDateStr(checkDate);
      if (entryDates.has(dateStr)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // 2. Monthly Count (今月の投稿数)
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const monthlyCount = entries.filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
    }).length;

    // 3. Writing Hint (今日書くことのヒント)
    const hints = [
      "今日の天気はどうでしたか？",
      "今日一番美味しかったものは？",
      "最近感謝したことは？",
      "今週末の予定は？",
      "最近学んだことは？",
      "昔の自分に言いたいことは？",
      "今一番欲しいものは？",
      "最近笑った出来事は？",
      "今日の小さな成功は？",
      "明日楽しみにしていることは？",
      "最近読んだ本や観た映画は？",
      "子供の頃の夢は？"
    ];
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const hint = hints[dayOfYear % hints.length];

    // 4. On This Day (去年の今日)
    let pastEntry: { entry: DiaryEntry, yearsAgo: number } | null = null;
    for (let i = 1; i <= 5; i++) {
        const targetDate = subYears(now, i);
        const targetDateStr = toDateStr(targetDate);
        const found = entries.find(e => e.date === targetDateStr);
        if (found) {
            pastEntry = { entry: found, yearsAgo: i };
            break;
        }
    }

    // 5. Mood History (直近14日間のムード推移)
    const moodScores: Record<string, number> = {
      'excellent': 5,
      'good': 4,
      'normal': 3,
      'bad': 2,
      'terrible': 1
    };
    
    const last14Days = eachDayOfInterval({
      start: subDays(now, 13),
      end: now
    });

    const moodHistory = last14Days.map(day => {
      const dateStr = toDateStr(day);
      const entry = entries.find(e => e.date === dateStr);
      return {
        date: format(day, 'M/d'),
        score: entry ? moodScores[entry.mood] || 3 : null,
        mood: entry?.mood
      };
    });

    return {
        streak,
        monthlyCount,
        hint,
        pastEntry,
        moodHistory
    };
  }, [entries]);

  if (loading || !stats) return null;

  // SVG Graph Helper
  const graphHeight = 60;
  const points = stats.moodHistory
    .map((d, i) => {
      if (d.score === null) return null;
      const x = (i / (stats.moodHistory.length - 1)) * 100;
      const y = graphHeight - ((d.score - 1) / 4) * graphHeight;
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Streak Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-orange-50 text-orange-500 rounded-lg">
          <Flame size={24} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800">{stats.streak}日</div>
          <div className="text-xs text-gray-500 font-medium">連続記録</div>
        </div>
      </div>

      {/* Monthly Count Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-500 rounded-lg">
          <Calendar size={24} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800">{stats.monthlyCount}件</div>
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap">今月の投稿</div>
        </div>
      </div>

      {/* Writing Hint Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center gap-2">
        <div className="flex items-center gap-2 text-purple-500 mb-1">
          <Sparkles size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Hint</span>
        </div>
        <div className="text-sm font-medium text-gray-700 leading-snug">
          {stats.hint}
        </div>
      </div>

      {/* Mood Graph & On This Day Combined Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
        {/* Graph Section */}
        <div className="flex-1 flex flex-col justify-between min-h-[60px]">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Activity size={14} />
            <span className="text-xs font-medium">気分の推移</span>
          </div>
          <div className="h-12 w-full relative flex items-end">
            {stats.moodHistory.filter(d => d.score !== null).length > 1 ? (
              <>
                <svg className="w-full h-full overflow-visible absolute inset-0" preserveAspectRatio="none" viewBox={`0 0 100 ${graphHeight}`}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                {stats.moodHistory.map((d, i) => d.score !== null && (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-white border-2 border-indigo-500 rounded-full"
                    style={{
                      left: `${(i / (stats.moodHistory.length - 1)) * 100}%`,
                      bottom: `${((d.score - 1) / 4) * 100}%`,
                      transform: 'translate(-50%, 50%)'
                    }}
                  />
                ))}
              </>
            ) : (
              <div className="w-full text-center text-xs text-gray-400">データ不足</div>
            )}
          </div>
        </div>

        {/* On This Day Section (Visible if exists) */}
        {stats.pastEntry && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <History size={12} />
              <span className="text-[10px] font-medium uppercase">{stats.pastEntry.yearsAgo}年前の今日</span>
            </div>
            <Link to={`/entry/${stats.pastEntry.entry.date}`} className="group block">
              <div className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {stats.pastEntry.entry.title || stats.pastEntry.entry.content.slice(0, 20) || '無題'}
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Calendar, BarChart2, PieChart, Hash, TrendingUp, Smile, Frown, Meh } from 'lucide-react';
import { storageService } from '../services/storageService';
import { DiaryEntry } from '../types';
import { format, subDays, eachDayOfInterval, startOfYear, endOfYear, getDay, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, parseISO, getYear, eachWeekOfInterval, endOfWeek, getDate, startOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';

export const AnalyticsPage: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await storageService.getAllEntries();
      setEntries(data);
      setLoading(false);
    };
    loadData();
  }, []);

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [loading, entries]);

  const stats = useMemo(() => {
    // if (entries.length === 0) return null; // データがなくても表示する

    const now = new Date();
    const toDateStr = (d: Date) => format(d, 'yyyy-MM-dd');
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    // 1. Overview
    const totalEntries = entries.length;
    const totalChars = entries.reduce((acc, e) => acc + (e.content?.length || 0), 0);
    
    // Streak calculation (reused logic)
    const entryDates = new Set(entries.map(e => e.date));
    let streak = 0;
    let checkDate = now;
    if (!entryDates.has(toDateStr(now))) {
        checkDate = subDays(now, 1);
    }
    while (entryDates.has(toDateStr(checkDate))) {
        streak++;
        checkDate = subDays(checkDate, 1);
    }

    // 2. Heatmap Data (Current Year: Jan 1 - Dec 31)
    // Align to weeks for grid display
    const heatmapStart = startOfWeek(yearStart);
    const heatmapEnd = endOfWeek(yearEnd);
    const heatmapDays = eachDayOfInterval({ start: heatmapStart, end: heatmapEnd });
    
    const heatmapData = heatmapDays.map(date => {
        const dateStr = toDateStr(date);
        const entry = entries.find(e => e.date === dateStr);
        let level = 0;
        if (entry) {
            const len = entry.content?.length || 0;
            if (len > 400) level = 4;
            else if (len > 200) level = 3;
            else if (len > 100) level = 2;
            else level = 1;
        }
        return { date, level, dateStr };
    });

    // 3. Monthly Trends (Current Year: Jan - Dec)
    const monthsOfYear = eachMonthOfInterval({
        start: yearStart,
        end: yearEnd
    });
    const monthlyStats = monthsOfYear.map(monthStart => {
        const monthKey = format(monthStart, 'yyyy-MM');
        const count = entries.filter(e => e.date.startsWith(monthKey)).length;
        return { 
            label: format(monthStart, 'M月'), 
            count,
            fullLabel: format(monthStart, 'yyyy年M月')
        };
    });

    // 4. Day of Week Activity
    const dayCounts = Array(7).fill(0);
    entries.forEach(e => {
        const day = getDay(parseISO(e.date));
        dayCounts[day]++;
    });
    const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
    const maxDayCount = Math.max(...dayCounts, 1);

    // 5. Mood Analysis
    const moodCounts: Record<string, number> = {};
    entries.forEach(e => {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    const moodData = Object.entries(moodCounts)
        .map(([mood, count]) => ({ mood, count }))
        .sort((a, b) => b.count - a.count);

    // 6. Tag Mood Score
    const tagMoodScores: Record<string, { total: number, count: number }> = {};
    const moodValue: Record<string, number> = {
        'excellent': 5, 'good': 4, 'normal': 3, 'bad': 2, 'terrible': 1
    };
    
    entries.forEach(e => {
        if (!e.tags) return;
        const score = moodValue[e.mood] || 3;
        e.tags.forEach(tag => {
            if (!tagMoodScores[tag]) tagMoodScores[tag] = { total: 0, count: 0 };
            tagMoodScores[tag].total += score;
            tagMoodScores[tag].count++;
        });
    });

    const tagMoodRanking = Object.entries(tagMoodScores)
        .map(([tag, { total, count }]) => ({
            tag,
            average: total / count,
            count
        }))
        .filter(item => item.count >= 2) // At least 2 entries to be significant
        .sort((a, b) => b.average - a.average)
        .slice(0, 5); // Top 5 happiest tags

    // 7. Tag Cloud
    const tagCounts: Record<string, number> = {};
    entries.forEach(e => {
        e.tags?.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
    });
    const tagCloud = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20);

    // 8. Mood Trend (Daily for Current Year)
    const moodTrendDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
    
    const moodTrend = moodTrendDays.map(day => {
        const dateStr = toDateStr(day);
        const entry = entries.find(e => e.date === dateStr);
        
        if (!entry) return { date: day, score: null, label: format(day, 'M/d') };

        return { 
            date: day, 
            score: moodValue[entry.mood] || 3,
            label: format(day, 'M/d')
        };
    });

    // Filter for visualization (connect points)
    const validMoodPoints = moodTrend
        .map((d, i) => ({ ...d, originalIndex: i }))
        .filter(d => d.score !== null) as { date: Date, score: number, label: string, originalIndex: number }[];

    return {
        totalEntries,
        totalChars,
        streak,
        heatmapData,
        monthlyStats,
        dayCounts,
        dayLabels,
        maxDayCount,
        moodData,
        tagMoodRanking,
        tagCloud,
        moodTrend,
        validMoodPoints
    };
  }, [entries]);

  if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;
  if (!stats) return <div className="p-8 text-center text-gray-500">データがありません</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">統計・分析</h1>
      </div>

      {/* 1. Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-xs font-medium mb-1">総投稿数</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalEntries} <span className="text-sm font-normal text-gray-400">記事</span></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-xs font-medium mb-1">総文字数</div>
            <div className="text-3xl font-bold text-gray-800">
                {stats.totalChars >= 10000 
                    ? <>{(stats.totalChars / 10000).toFixed(1)} <span className="text-sm font-normal text-gray-400">万文字</span></>
                    : <>{stats.totalChars} <span className="text-sm font-normal text-gray-400">文字</span></>
                }
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-xs font-medium mb-1">現在のストリーク</div>
            <div className="text-3xl font-bold text-orange-500">{stats.streak} <span className="text-sm font-normal text-gray-400">日連続</span></div>
        </div>
      </div>

      {/* 2. Heatmap (GitHub Style) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-green-600" />
            <h2 className="font-bold text-gray-800">アクティビティ ({getYear(new Date())}年)</h2>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2">
            {/* Dynamic rendering based on actual weeks in the year */}
            {Array.from({ length: Math.ceil(stats.heatmapData.length / 7) }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const dataIndex = weekIndex * 7 + dayIndex;
                        const data = stats.heatmapData[dataIndex];
                        if (!data) return <div key={dayIndex} className="w-3 h-3" />;
                        
                        const colors = [
                            'bg-gray-100', // Level 0
                            'bg-green-200', // Level 1
                            'bg-green-300', // Level 2
                            'bg-green-400', // Level 3
                            'bg-green-500', // Level 4
                        ];
                        
                        return (
                            <div 
                                key={dayIndex} 
                                className={`w-3 h-3 rounded-sm ${colors[data.level]}`} 
                                title={`${data.dateStr}: Level ${data.level}`}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
        <div className="flex justify-end items-center gap-2 mt-2 text-xs text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            </div>
            <span>More</span>
        </div>
      </div>

      {/* 3. Mood Trend (Daily) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
            <Activity size={18} className="text-orange-500" />
            <h2 className="font-bold text-gray-800">気分の推移 ({getYear(new Date())}年・日次)</h2>
        </div>
        <div className="h-64 w-full relative flex border border-gray-100 rounded-lg overflow-hidden bg-gray-50/50">
            {/* Y-axis labels */}
            <div className="w-12 flex-shrink-0 flex flex-col justify-between text-[10px] text-gray-400 py-4 px-2 border-r border-gray-100 bg-white z-10 font-mono">
                <span>5.0</span>
                <span>4.0</span>
                <span>3.0</span>
                <span>2.0</span>
                <span>1.0</span>
            </div>
            
            {/* Scrollable Chart Area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-x-auto relative custom-scrollbar">
                 {/* Container for SVG */}
                 <div style={{ width: `${Math.max(stats.moodTrend.length * 8, 800)}px`, height: '100%' }} className="relative bg-white">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
                        <div className="border-t border-gray-100 w-full h-0 border-dashed"></div>
                        <div className="border-t border-gray-100 w-full h-0 border-dashed"></div>
                        <div className="border-t border-gray-100 w-full h-0 border-dashed"></div>
                        <div className="border-t border-gray-100 w-full h-0 border-dashed"></div>
                        <div className="border-t border-gray-100 w-full h-0 border-dashed"></div>
                    </div>

                    {/* Month Labels (HTML) */}
                    {stats.moodTrend.map((d, i) => {
                        if (getDate(d.date) === 1) {
                            return (
                                <div
                                    key={i}
                                    className="absolute bottom-1 text-[10px] text-gray-400 pointer-events-none"
                                    style={{ left: `${(i / (stats.moodTrend.length - 1)) * 100}%` }}
                                >
                                    {format(d.date, 'M月')}
                                </div>
                            );
                        }
                        return null;
                    })}

                    {stats.validMoodPoints.length > 1 ? (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            
                            {/* Area Fill */}
                            <path
                                d={`
                                    M ${stats.validMoodPoints[0] ? (stats.validMoodPoints[0].originalIndex / (stats.moodTrend.length - 1)) * 100 : 0},100
                                    ${stats.validMoodPoints.map((p) => {
                                        const x = (p.originalIndex / (stats.moodTrend.length - 1)) * 100;
                                        const y = 100 - ((p.score - 1) / 4) * 100;
                                        return `L ${x},${y}`;
                                    }).join(' ')}
                                    L ${stats.validMoodPoints[stats.validMoodPoints.length-1] ? (stats.validMoodPoints[stats.validMoodPoints.length-1].originalIndex / (stats.moodTrend.length - 1)) * 100 : 100},100
                                    Z
                                `}
                                fill="url(#moodGradient)"
                                stroke="none"
                            />

                            {/* Line Stroke */}
                            <polyline
                                points={stats.validMoodPoints.map((p) => {
                                    const x = (p.originalIndex / (stats.moodTrend.length - 1)) * 100;
                                    const y = 100 - ((p.score - 1) / 4) * 100;
                                    return `${x},${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#F97316"
                                strokeWidth="1.5"
                                vectorEffect="non-scaling-stroke"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            
                            {/* Hover Interaction (Invisible bars) */}
                            {stats.moodTrend.map((d, i) => (
                                <rect
                                    key={i}
                                    x={(i / (stats.moodTrend.length - 1)) * 100 - 0.5}
                                    y="0"
                                    width={100 / stats.moodTrend.length}
                                    height="100"
                                    fill="transparent"
                                    className="hover:bg-gray-900/5 cursor-crosshair group"
                                >
                                    <title>{`${d.label}: ${d.score ? d.score.toFixed(1) : 'データなし'}`}</title>
                                </rect>
                            ))}
                        </svg>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            データが不足しています
                        </div>
                    )}
                 </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Monthly Trends */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-blue-500" />
                <h2 className="font-bold text-gray-800">月間投稿数推移</h2>
            </div>
            <div className="h-48 flex items-end gap-2 border-b border-gray-100 pb-2">
                {stats.monthlyStats.map((m, i) => {
                    const max = Math.max(...stats.monthlyStats.map(s => s.count), 1);
                    const height = (m.count / max) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                            <div className="w-full relative flex items-end h-full bg-gray-50 rounded-t-md overflow-hidden">
                                <div 
                                    className="w-full bg-blue-100 transition-all group-hover:bg-blue-200 relative"
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {m.count}件
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-400">{m.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 4. Day of Week Activity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <BarChart2 size={18} className="text-indigo-500" />
                <h2 className="font-bold text-gray-800">曜日別アクティビティ</h2>
            </div>
            <div className="h-48 flex items-end gap-3 border-b border-gray-100 pb-2">
                {stats.dayCounts.map((count, i) => {
                    const height = (count / stats.maxDayCount) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                            <div className="w-full relative flex items-end h-full bg-gray-50 rounded-t-md overflow-hidden">
                                <div 
                                    className="w-full bg-indigo-100 transition-all group-hover:bg-indigo-200 relative"
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        {count}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{stats.dayLabels[i]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Mood Analysis (Pie Chart approximation) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <PieChart size={18} className="text-pink-500" />
                <h2 className="font-bold text-gray-800">気分の割合</h2>
            </div>
            <div className="flex flex-col gap-3">
                {stats.moodData.map((d, i) => {
                    const total = stats.totalEntries;
                    const percentage = Math.round((d.count / total) * 100);
                    const moodEmojis: Record<string, string> = {
                        'excellent': '😆 最高',
                        'good': '😊 良い',
                        'normal': '😶 普通',
                        'bad': '😞 悪い',
                        'terrible': '😫 最悪'
                    };
                    const colors: Record<string, string> = {
                        'excellent': 'bg-pink-500',
                        'good': 'bg-orange-400',
                        'normal': 'bg-green-400',
                        'bad': 'bg-blue-400',
                        'terrible': 'bg-gray-400'
                    };
                    
                    return (
                        <div key={d.mood} className="flex items-center gap-3">
                            <div className="w-20 text-sm text-gray-600">{moodEmojis[d.mood]}</div>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${colors[d.mood] || 'bg-gray-300'}`} 
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="w-12 text-right text-sm text-gray-500">{percentage}%</div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 6. Happiest Tags */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Smile size={18} className="text-yellow-500" />
                <h2 className="font-bold text-gray-800">幸せタグランキング</h2>
            </div>
            <div className="space-y-4">
                {stats.tagMoodRanking.length > 0 ? (
                    stats.tagMoodRanking.map((item, i) => (
                        <div key={item.tag} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    i === 0 ? 'bg-yellow-100 text-yellow-600' : 
                                    i === 1 ? 'bg-gray-100 text-gray-600' : 
                                    'bg-orange-50 text-orange-600'
                                }`}>
                                    {i + 1}
                                </div>
                                <span className="font-medium text-gray-700">#{item.tag}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, starI) => (
                                        <div 
                                            key={starI} 
                                            className={`w-2 h-2 rounded-full ${
                                                starI < Math.round(item.average) ? 'bg-yellow-400' : 'bg-gray-200'
                                            }`} 
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400">({item.average.toFixed(1)})</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400 text-sm py-8">
                        タグ付きの日記がまだ十分にありません
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 7. Tag Cloud */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
            <Hash size={18} className="text-purple-500" />
            <h2 className="font-bold text-gray-800">よく使うタグ</h2>
        </div>
        <div className="flex flex-wrap gap-2">
            {stats.tagCloud.map(([tag, count]) => {
                const sizeClass = 
                    count > 10 ? 'text-lg px-4 py-2' : 
                    count > 5 ? 'text-base px-3 py-1.5' : 
                    'text-sm px-2 py-1';
                const opacity = Math.min(1, 0.5 + (count / 20) * 0.5);
                
                return (
                    <span 
                        key={tag} 
                        className={`bg-purple-50 text-purple-700 rounded-full ${sizeClass} transition-all hover:bg-purple-100 cursor-default`}
                        style={{ opacity }}
                    >
                        #{tag} <span className="opacity-60 text-[0.8em] ml-1">{count}</span>
                    </span>
                );
            })}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useMemo } from 'react';
import { DiaryEntry } from '../types';
import { storageService } from '../services/storageService';
import { Flame, Calendar, Tag, Type } from 'lucide-react';
import { subDays, parseISO, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';

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
    if (entries.length === 0) return null;

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

    // 2. Monthly Count (月間投稿数)
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const monthlyCount = entries.filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
    }).length;

    // 3. Top Tags (よく使うタグ)
    const tagCounts: Record<string, number> = {};
    entries.forEach(e => {
        e.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // 4. Top Words (よく使う単語 - 簡易実装)
    const wordCounts: Record<string, number> = {};
    try {
        // @ts-ignore: Intl.Segmenter is available in modern environments
        const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
        entries.forEach(e => {
            const text = e.content;
            // @ts-ignore
            const segments = segmenter.segment(text);
            for (const seg of segments) {
                if (seg.isWordLike) {
                    const word = seg.segment;
                    // 2文字以上のみカウント
                    if (word.length >= 2) {
                         wordCounts[word] = (wordCounts[word] || 0) + 1;
                    }
                }
            }
        });
    } catch (e) {
        console.warn('Intl.Segmenter not supported');
    }
    
    // 除外ワード（ストップワード）
    const stopWords = new Set([
      'それ', 'これ', 'あれ', 'どれ', 'ため', 'こと', 'もの', 'よう', 'そう', 
      '今日', '明日', '昨日', '自分', '時間', '本当', '最近', '感じ', '思う',
      'さん', 'ちゃん', 'くん', 'ます', 'です', 'した', 'ある', 'いる', 'ない'
    ]);
    
    const topWords = Object.entries(wordCounts)
        .filter(([word]) => !stopWords.has(word))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return {
        streak,
        monthlyCount,
        topTags,
        topWords
    };
  }, [entries]);

  if (loading || !stats) return null;

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
          <div className="text-xs text-gray-500 font-medium">今月の投稿</div>
        </div>
      </div>

      {/* Top Tags Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center gap-2 md:col-span-1">
        <div className="flex items-center gap-2 text-gray-500 mb-1">
          <Tag size={14} />
          <span className="text-xs font-medium">よく使うタグ</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {stats.topTags.length > 0 ? (
            stats.topTags.map(([tag, count]) => (
              <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                #{tag} <span className="text-gray-400 ml-0.5">{count}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">データなし</span>
          )}
        </div>
      </div>

      {/* Top Words Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center gap-2 md:col-span-1">
        <div className="flex items-center gap-2 text-gray-500 mb-1">
          <Type size={14} />
          <span className="text-xs font-medium">よく使う言葉</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {stats.topWords.length > 0 ? (
            stats.topWords.map(([word, count]) => (
              <span key={word} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                {word}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">データなし</span>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ReviewSection } from '../components/ReviewSection';
import { CalendarGrid } from '../components/CalendarGrid';
import { Search } from 'lucide-react';
import { useDiary } from '../hooks/useDiary';
import { Link } from 'react-router-dom';
import { formatDateTitle } from '../utils/dateUtils';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { search } = useDiary();

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length > 0) {
      const results = await search(q);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight mb-2">My Digital Paper</h1>
        <p className="text-muted text-sm">Create, reflect, and remember.</p>
      </div>

      <div className="relative max-w-xl mx-auto mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="日記を検索..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all"
        />
        
        {/* Search Results Dropdown */}
        {searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto z-10">
            {searchResults.length > 0 ? (
              searchResults.map(entry => (
                <Link to={`/entry/${entry.date}`} key={entry.id} className="block p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <div className="text-xs text-gray-400 mb-1">{entry.date}</div>
                  <div className="font-medium text-gray-800 line-clamp-2">{entry.content.slice(0, 100) || '内容なし'}</div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">見つかりませんでした</div>
            )}
          </div>
        )}
      </div>

      {!searchQuery && (
        <>
          <ReviewSection />
          <CalendarGrid />
        </>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { EntryPage } from './pages/EntryPage';
import { SettingsModal } from './components/SettingsModal';
import { Settings, BookOpen } from 'lucide-react';
import { getISODate } from './utils/dateUtils';

const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const today = getISODate(new Date());

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-800">
            <BookOpen size={20} className="text-gray-700" />
            <span className="hidden sm:inline">Diary</span>
          </Link>
          
          <div className="flex items-center gap-4">
             <Link 
              to={`/entry/${today}`}
              className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
            >
              今日の日記を書く
            </Link>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/entry/:date" element={<EntryPage />} />
        </Routes>
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;
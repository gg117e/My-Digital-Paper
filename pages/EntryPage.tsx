import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '../components/Editor';
import { formatDateTitle } from '../utils/dateUtils';
import { ChevronLeft } from 'lucide-react';

export const EntryPage: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();

  // Validate date roughly
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return <div className="text-center p-10">Invalid Date</div>;
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 -ml-2 hover:bg-white hover:shadow-sm rounded-full text-gray-500 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">
          {formatDateTitle(date)}
        </h1>
      </div>
      
      <Editor date={date} />
    </div>
  );
};
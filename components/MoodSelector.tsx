import React from 'react';
import { MoodType, MOOD_OPTIONS } from '../types';

interface MoodSelectorProps {
  selectedMood: MoodType;
  onChange: (mood: MoodType) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-600 mb-3">今日の気分</label>
      <div className="flex flex-wrap gap-2">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onChange(mood.value)}
            className={`
              flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
              ${selectedMood === mood.value 
                ? `${mood.bgColor.replace('hover:', '')} border-current ${mood.color} shadow-sm scale-110` 
                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-400 hover:scale-105 grayscale hover:grayscale-0'
              }
            `}
            type="button"
            title={mood.label}
          >
            <span className="text-2xl leading-none">{mood.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

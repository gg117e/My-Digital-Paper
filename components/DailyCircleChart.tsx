import React, { useState, useMemo } from 'react';
import { ScheduleItem, ScheduleCategory } from '../types';

interface Props {
  schedule: ScheduleItem[];
  size?: number;
}

const CATEGORY_COLORS: Record<ScheduleCategory, string> = {
  work: 'text-blue-400',
  study: 'text-indigo-400',
  personal: 'text-green-400',
  routine: 'text-orange-400',
  sleep: 'text-purple-400',
  urgent: 'text-red-400',
  other: 'text-gray-400',
};

const CATEGORY_BG_COLORS: Record<ScheduleCategory, string> = {
  work: 'fill-blue-100',
  study: 'fill-indigo-100',
  personal: 'fill-green-100',
  routine: 'fill-orange-100',
  sleep: 'fill-purple-100',
  urgent: 'fill-red-100',
  other: 'fill-gray-100',
};

const CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  work: '仕事/作業',
  study: '学習/勉強',
  personal: '私用',
  routine: '生活/ルーティン',
  sleep: '睡眠',
  urgent: '緊急',
  other: 'その他',
};

interface InternalProps extends Props {
  externalHoverId?: string | null;
}

export const DailyCircleChart: React.FC<InternalProps> = ({ schedule, size = 300, externalHoverId = null }) => {
  const [hoveredItem, setHoveredItem] = useState<ScheduleItem | null>(null);

  const center = size / 2;
  const radius = size * 0.4;
  const innerRadius = size * 0.25;

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getCoordinatesForPercent = (percent: number, r: number) => {
    const x = center + r * Math.cos(2 * Math.PI * percent - Math.PI / 2);
    const y = center + r * Math.sin(2 * Math.PI * percent - Math.PI / 2);
    return [x, y];
  };

  const sortedSchedule = useMemo(() => {
    return [...schedule].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [schedule]);

  const slices = useMemo(() => {
    return sortedSchedule.map((item) => {
      const startMinutes = timeToMinutes(item.startTime);
      const endMinutes = timeToMinutes(item.endTime);
      
      // Handle crossing midnight (though current logic splits items)
      // Assuming items are within 0-24h for now as per previous fixes
      
      const startPercent = startMinutes / 1440;
      const endPercent = endMinutes / 1440;
      
      // Calculate path
      const [startX, startY] = getCoordinatesForPercent(startPercent, radius);
      const [endX, endY] = getCoordinatesForPercent(endPercent, radius);
      const [innerStartX, innerStartY] = getCoordinatesForPercent(startPercent, innerRadius);
      const [innerEndX, innerEndY] = getCoordinatesForPercent(endPercent, innerRadius);

      const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

      const pathData = [
        `M ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `L ${innerEndX} ${innerEndY}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
        'Z',
      ].join(' ');

      return {
        item,
        pathData,
        colorClass: CATEGORY_COLORS[item.category],
        bgClass: CATEGORY_BG_COLORS[item.category],
      };
    });
  }, [sortedSchedule, radius, innerRadius, center]);

  // Clock markers (every 3 hours)
  const markers = [0, 3, 6, 9, 12, 15, 18, 21].map(hour => {
    const percent = (hour * 60) / 1440;
    const [x, y] = getCoordinatesForPercent(percent, radius + 15);
    return { hour, x, y };
  });

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-0">
        {/* Background Circle */}
        <circle cx={center} cy={center} r={radius} className="fill-gray-50 stroke-gray-100" strokeWidth="1" />
        
        {/* Slices */}
        {slices.map((slice, i) => {
          const isActive = hoveredItem?.id === slice.item.id || externalHoverId === slice.item.id;
          return (
            <path
              key={slice.item.id}
              d={slice.pathData}
              className={`${slice.bgClass} transition-opacity cursor-pointer stroke-white ${isActive ? 'opacity-100' : 'opacity-80'}`}
              style={{ filter: isActive ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' : undefined }}
              onMouseEnter={() => setHoveredItem(slice.item)}
              onMouseLeave={() => setHoveredItem(null)}
            />
          );
        })}

        {/* Inner Circle (Hole) */}
        <circle cx={center} cy={center} r={innerRadius} className="fill-white" />

        {/* Clock Markers */}
        {markers.map(m => (
          <text
            key={m.hour}
            x={m.x}
            y={m.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-400 font-medium"
            style={{ fontSize: '10px' }}
          >
            {m.hour}
          </text>
        ))}
      </svg>

      {/* Center Info / Tooltip */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-32"
      >
        {hoveredItem ? (
          <div className="animate-in fade-in zoom-in duration-200">
            <div className={`text-xs font-bold ${CATEGORY_COLORS[hoveredItem.category]}`}>
              {CATEGORY_LABELS[hoveredItem.category]}
            </div>
            <div className="text-sm font-bold text-gray-800 truncate">
              {hoveredItem.title}
            </div>
            <div className="text-xs text-gray-500">
              {hoveredItem.startTime} - {hoveredItem.endTime}
            </div>
            {hoveredItem.description && (
                <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                    {hoveredItem.description}
                </div>
            )}
          </div>
        ) : (
          <div className="text-gray-300 text-xs font-medium">
            24H Schedule
          </div>
        )}
      </div>
    </div>
  );
};

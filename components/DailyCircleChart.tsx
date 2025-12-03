import React, { useState, useMemo } from 'react';
import { ScheduleItem, ScheduleCategory } from '../types';

interface Props {
  schedule: ScheduleItem[];
  size?: number;
}

const CATEGORY_COLORS: Record<ScheduleCategory, string> = {
  research: 'text-purple-400',
  university: 'text-pink-400',
  work: 'text-blue-400',
  dev: 'text-cyan-400',
  study: 'text-indigo-400',
  reading: 'text-teal-400',
  hobby: 'text-green-400',
  routine: 'text-orange-400',
  commute: 'text-yellow-400',
  sleep: 'text-slate-600',
  other: 'text-gray-400',
};

const CATEGORY_BG_COLORS: Record<ScheduleCategory, string> = {
  research: 'fill-purple-100',
  university: 'fill-pink-100',
  work: 'fill-blue-100',
  dev: 'fill-cyan-100',
  study: 'fill-indigo-100',
  reading: 'fill-teal-100',
  hobby: 'fill-green-100',
  routine: 'fill-orange-100',
  commute: 'fill-yellow-100',
  sleep: 'fill-slate-300',
  other: 'fill-gray-100',
};

const CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  research: '研究',
  university: '大学',
  work: '仕事',
  dev: '開発',
  study: '学習',
  reading: '読書',
  hobby: '趣味',
  routine: '生活/ルーティン',
  commute: '移動',
  sleep: '睡眠',
  other: 'その他',
};

interface InternalProps extends Props {
  externalHoverId?: string | null;
  onSliceClick?: (item: ScheduleItem) => void;
  onAddAt?: (time: string) => void; // called when clicking empty area - returns HH:mm
}

export const DailyCircleChart: React.FC<InternalProps> = ({ schedule, size = 300, externalHoverId = null, onSliceClick, onAddAt }) => {
  const [hoveredItem, setHoveredItem] = useState<ScheduleItem | null>(null);

  const center = size / 2;
  const radius = size * 0.4;
  const innerRadius = size * 0.15;

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

  const hasMidnightSplit = useMemo(() => {
    return sortedSchedule.some(s => s.category === 'sleep' && s.startTime === '00:00')
      && sortedSchedule.some(s => s.category === 'sleep' && s.endTime === '23:59');
  }, [sortedSchedule]);

  const slices = useMemo(() => {
    return sortedSchedule
      .map((item) => {
      // If there's a midnight-split for sleep, hide the end-of-day slice (23:59) to avoid showing previous-day sleep
      if (hasMidnightSplit && item.category === 'sleep' && item.endTime === '23:59') return null;
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

      // Calculate text position
      const midPercent = (startPercent + endPercent) / 2;
      const textRadius = (radius + innerRadius) / 2;
      const [textX, textY] = getCoordinatesForPercent(midPercent, textRadius);
      const label = item.title || CATEGORY_LABELS[item.category];
      const showLabel = (endPercent - startPercent) > 0.04; // Show if > ~1 hour

      return {
        item,
        pathData,
        colorClass: CATEGORY_COLORS[item.category],
        bgClass: CATEGORY_BG_COLORS[item.category],
        textX,
        textY,
        label,
        showLabel,
      };
    })
    .filter(Boolean) as Array<{
      item: ScheduleItem; 
      pathData: string; 
      colorClass: string; 
      bgClass: string;
      textX: number;
      textY: number;
      label: string;
      showLabel: boolean;
    }>;
  }, [sortedSchedule, radius, innerRadius, center]);

  // Clock markers (every 3 hours)
  const markers = [0, 3, 6, 9, 12, 15, 18, 21].map(hour => {
    const percent = (hour * 60) / 1440;
    const [x, y] = getCoordinatesForPercent(percent, radius + 15);
    return { hour, x, y };
  });

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-0" onClick={(e) => {
        // add new event at clicked time
        if (!onAddAt) return;
        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const dx = x - center;
        const dy = y - center;
        const angle = Math.atan2(dy, dx); // -PI..PI
        let percent = (angle + Math.PI/2) / (2 * Math.PI);
        if (percent < 0) percent += 1;
        const minutes = Math.round(percent * 1440);
        const hh = Math.floor(minutes / 60) % 24;
        const mm = minutes % 60;
        const time = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
        onAddAt(time);
      }}>
        {/* Background Circle */}
        <circle cx={center} cy={center} r={radius} className="fill-gray-50 stroke-gray-100" strokeWidth="1" />
        
        {/* Slices */}
        {slices.map((slice, i) => {
          const isActive = hoveredItem?.id === slice.item.id || externalHoverId === slice.item.id;
          return (
            <g key={slice.item.id}>
              <path
                d={slice.pathData}
                className={`${slice.bgClass} transition-opacity cursor-pointer stroke-white ${isActive ? 'opacity-100' : 'opacity-80'}`}
                style={{ filter: isActive ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' : undefined }}
                onMouseEnter={() => setHoveredItem(slice.item)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={(e) => { e.stopPropagation(); onSliceClick?.(slice.item); }}
              />
              {slice.showLabel && (
                <text
                  x={slice.textX}
                  y={slice.textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] fill-gray-700 font-medium pointer-events-none select-none"
                  style={{ textShadow: '0px 0px 2px rgba(255,255,255,0.8)' }}
                >
                  {slice.label.length > 8 ? slice.label.slice(0, 7) + '..' : slice.label}
                </text>
              )}
            </g>
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
    </div>
  );
};

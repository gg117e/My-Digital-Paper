import React, { useState, useMemo, useRef } from 'react';
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
  onSliceMove?: (item: ScheduleItem, newStartTime: string, newEndTime: string) => void;
}

export const DailyCircleChart: React.FC<InternalProps> = ({ schedule, size = 300, externalHoverId = null, onSliceClick, onAddAt, onSliceMove }) => {
  const [hoveredItem, setHoveredItem] = useState<ScheduleItem | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartAngle, setDragStartAngle] = useState<number | null>(null);
  const [dragOriginalStartMinutes, setDragOriginalStartMinutes] = useState<number | null>(null);
  const [dragOriginalEndMinutes, setDragOriginalEndMinutes] = useState<number | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingRef = useRef(false);
  const wasDraggingRef = useRef(false);

  const center = size / 2;
  const radius = size * 0.4;
  const innerRadius = size * 0.15;

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Drag Logic
  React.useEffect(() => {
    if (!draggingId || !onSliceMove || !dragMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - center;
      const dy = y - center;
      const angle = Math.atan2(dy, dx); // -PI..PI
      
      let currentAngle = angle + Math.PI / 2;
      if (currentAngle < 0) currentAngle += 2 * Math.PI;
      
      let startAngle = dragStartAngle! + Math.PI / 2;
      if (startAngle < 0) startAngle += 2 * Math.PI;

      let deltaAngle = currentAngle - startAngle;
      // Normalize delta to -PI..PI to handle crossing 0 angle correctly
      if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
      if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

      const deltaMinutes = (deltaAngle / (2 * Math.PI)) * 1440;
      
      const item = schedule.find(s => s.id === draggingId);
      if (!item || dragOriginalStartMinutes === null || dragOriginalEndMinutes === null) return;

      let newStartMinutes = dragOriginalStartMinutes;
      let newEndMinutes = dragOriginalEndMinutes;

      if (dragMode === 'move') {
        const duration = dragOriginalEndMinutes - dragOriginalStartMinutes;
        newStartMinutes = dragOriginalStartMinutes + deltaMinutes;
        newStartMinutes = Math.round(newStartMinutes / 15) * 15;
        
        // Clamp to 0-1440 (No wrapping)
        if (newStartMinutes < 0) newStartMinutes = 0;
        if (newStartMinutes + duration > 1440) newStartMinutes = 1440 - duration;
        
        newEndMinutes = newStartMinutes + duration;
      } else if (dragMode === 'resize-start') {
        newStartMinutes = dragOriginalStartMinutes + deltaMinutes;
        newStartMinutes = Math.round(newStartMinutes / 15) * 15;
        
        // Clamp start
        if (newStartMinutes < 0) newStartMinutes = 0;
        // Don't let start pass end (min duration 15m)
        if (newStartMinutes > dragOriginalEndMinutes - 15) newStartMinutes = dragOriginalEndMinutes - 15;
        
      } else if (dragMode === 'resize-end') {
        newEndMinutes = dragOriginalEndMinutes + deltaMinutes;
        newEndMinutes = Math.round(newEndMinutes / 15) * 15;

        // Clamp end
        if (newEndMinutes > 1440) newEndMinutes = 1440;
        // Don't let end go before start (min duration 15m)
        if (newEndMinutes < dragOriginalStartMinutes + 15) newEndMinutes = dragOriginalStartMinutes + 15;
      }
      
      onSliceMove(item, minutesToTime(newStartMinutes), minutesToTime(newEndMinutes));
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        wasDraggingRef.current = true;
        setTimeout(() => { wasDraggingRef.current = false; }, 100);
      }
      isDraggingRef.current = false;
      setDraggingId(null);
      setDragMode(null);
      setDragStartAngle(null);
      setDragOriginalStartMinutes(null);
      setDragOriginalEndMinutes(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dragMode, dragStartAngle, dragOriginalStartMinutes, dragOriginalEndMinutes, schedule, onSliceMove, center]);

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

      // Handle positions
      const handleRadius = (radius + innerRadius) / 2;
      const [handleStartX, handleStartY] = getCoordinatesForPercent(startPercent, handleRadius);
      const [handleEndX, handleEndY] = getCoordinatesForPercent(endPercent, handleRadius);

      return {
        item,
        pathData,
        colorClass: CATEGORY_COLORS[item.category],
        bgClass: CATEGORY_BG_COLORS[item.category],
        textX,
        textY,
        label,
        showLabel,
        handleStartX,
        handleStartY,
        handleEndX,
        handleEndY,
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
      handleStartX: number;
      handleStartY: number;
      handleEndX: number;
      handleEndY: number;
    }>;
  }, [sortedSchedule, radius, innerRadius, center]);

  // Grid lines (every 1 hour)
  const gridLines = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const percent = (i * 60) / 1440;
      const isMajor = i % 3 === 0;
      // Lines start just outside the circle
      const rStart = radius + 2; 
      const rEnd = radius + (isMajor ? 10 : 6);
      const [x1, y1] = getCoordinatesForPercent(percent, rStart);
      const [x2, y2] = getCoordinatesForPercent(percent, rEnd);
      
      // Text position
      const [tx, ty] = getCoordinatesForPercent(percent, radius + 20);
      
      return { hour: i, x1, y1, x2, y2, tx, ty, isMajor };
    });
  }, [radius, center]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg 
        ref={svgRef}
        width={size} 
        height={size} 
        className="transform -rotate-0 select-none" 
        onClick={(e) => {
        // add new event at clicked time
        if (!onAddAt || wasDraggingRef.current) return;
        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const dx = x - center;
        const dy = y - center;
        const angle = Math.atan2(dy, dx); // -PI..PI
        let percent = (angle + Math.PI/2) / (2 * Math.PI);
        if (percent < 0) percent += 1;
        let minutes = Math.round(percent * 1440);
        // Snap to 15 minutes
        minutes = Math.round(minutes / 15) * 15;
        if (minutes >= 1440) minutes = 0;
        
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
            <g 
              key={slice.item.id}
              onMouseEnter={() => setHoveredItem(slice.item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <path
                d={slice.pathData}
                className={`${slice.bgClass} transition-opacity cursor-pointer stroke-white ${isActive ? 'opacity-100' : 'opacity-80'}`}
                style={{ filter: isActive ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' : undefined }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (onSliceMove) {
                    isDraggingRef.current = true;
                    const rect = svgRef.current!.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const dx = x - center;
                    const dy = y - center;
                    const angle = Math.atan2(dy, dx);
                    
                    setDraggingId(slice.item.id);
                    setDragMode('move');
                    setDragStartAngle(angle);
                    setDragOriginalStartMinutes(timeToMinutes(slice.item.startTime));
                    setDragOriginalEndMinutes(timeToMinutes(slice.item.endTime));
                  }
                }}
                onClick={(e) => { e.stopPropagation(); onSliceClick?.(slice.item); }}
              />
              
              {/* Resize Handles (Visible on Hover) */}
              {isActive && onSliceMove && (
                <>
                  {/* Start Handle */}
                  <circle
                    cx={slice.handleStartX}
                    cy={slice.handleStartY}
                    r={8}
                    className="fill-white stroke-gray-400 cursor-ew-resize hover:fill-blue-100 hover:stroke-blue-500"
                    strokeWidth={2}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      isDraggingRef.current = true;
                      const rect = svgRef.current!.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const dx = x - center;
                      const dy = y - center;
                      const angle = Math.atan2(dy, dx);
                      
                      setDraggingId(slice.item.id);
                      setDragMode('resize-start');
                      setDragStartAngle(angle);
                      setDragOriginalStartMinutes(timeToMinutes(slice.item.startTime));
                      setDragOriginalEndMinutes(timeToMinutes(slice.item.endTime));
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {/* End Handle */}
                  <circle
                    cx={slice.handleEndX}
                    cy={slice.handleEndY}
                    r={8}
                    className="fill-white stroke-gray-400 cursor-ew-resize hover:fill-blue-100 hover:stroke-blue-500"
                    strokeWidth={2}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      isDraggingRef.current = true;
                      const rect = svgRef.current!.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const dx = x - center;
                      const dy = y - center;
                      const angle = Math.atan2(dy, dx);
                      
                      setDraggingId(slice.item.id);
                      setDragMode('resize-end');
                      setDragStartAngle(angle);
                      setDragOriginalStartMinutes(timeToMinutes(slice.item.startTime));
                      setDragOriginalEndMinutes(timeToMinutes(slice.item.endTime));
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </>
              )}

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

        {/* Grid Lines and Markers */}
        {gridLines.map(m => (
          <React.Fragment key={m.hour}>
            <line
              x1={m.x1}
              y1={m.y1}
              x2={m.x2}
              y2={m.y2}
              className={m.isMajor ? "stroke-gray-400" : "stroke-gray-300"}
              strokeWidth={m.isMajor ? 2 : 1}
            />
            {m.isMajor && (
              <text
                x={m.tx}
                y={m.ty}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-gray-500 font-medium"
              >
                {m.hour}
              </text>
            )}
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
};

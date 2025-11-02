import React, { useCallback, useRef, useState, useEffect } from 'react';

interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  label?: string;
  className?: string;
}

export function Knob({
  value,
  onChange,
  min = -90,
  max = 90,
  step = 5,
  size = 40,
  label,
  className = ''
}: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);

  // Normalize value to 0-1 range
  const normalizedValue = (value - min) / (max - min);
  
  // Convert to angle (-135° to +135°, giving 270° total range)
  const angle = -135 + (normalizedValue * 270);

  // Get angle from pointer position relative to knob center
  const getAngleFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!knobRef.current) return 0;
    
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    // Calculate angle in degrees (0° = top, clockwise positive)
    let angleRad = Math.atan2(deltaX, -deltaY);
    let angleDeg = (angleRad * 180) / Math.PI;
    
    // Normalize to 0-360 range
    if (angleDeg < 0) angleDeg += 360;
    
    return angleDeg;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const currentAngle = getAngleFromPointer(e.clientX, e.clientY);
    setIsDragging(true);
    setStartAngle(currentAngle);
    setStartValue(value);
    e.preventDefault();
    
    // Capture pointer for better touch handling
    if (knobRef.current) {
      knobRef.current.setPointerCapture(e.pointerId);
    }
  }, [value, getAngleFromPointer]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;

    const currentAngle = getAngleFromPointer(e.clientX, e.clientY);
    let deltaAngle = currentAngle - startAngle;
    
    // Handle angle wrap-around
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    
    // Convert angle change to value change
    const valueRange = max - min;
    const angleRange = 270; // Our knob has 270° of rotation
    const deltaValue = (deltaAngle / angleRange) * valueRange;
    
    let newValue = startValue + deltaValue;
    
    // Apply step rounding
    newValue = Math.round(newValue / step) * step;
    
    // Clamp to bounds
    newValue = Math.max(min, Math.min(max, newValue));
    
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [isDragging, startAngle, startValue, min, max, step, value, onChange, getAngleFromPointer]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      // Disable scrolling during knob interaction
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleDoubleClick = useCallback(() => {
    // Reset to center value on double-click
    const centerValue = (min + max) / 2;
    const steppedCenter = Math.round(centerValue / step) * step;
    onChange(steppedCenter);
  }, [min, max, step, onChange]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {label && (
        <div className="text-xs text-center">
          <div>{label}</div>
          <div className="text-muted-foreground tabular-nums">{value}°</div>
        </div>
      )}
      
      <div
        ref={knobRef}
        className={`relative rounded-full bg-black cursor-pointer select-none touch-none ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{ width: size, height: size, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* White dot indicator */}
        <div
          className="absolute w-full h-full flex items-start justify-center pt-1"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      </div>
    </div>
  );
}
import React, { useRef, useLayoutEffect } from 'react';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export const AutoResizeTextarea: React.FC<Props> = ({ value, className, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={1}
      className={`overflow-hidden resize-none ${className}`}
      {...props}
    />
  );
};
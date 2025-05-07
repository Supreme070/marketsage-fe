"use client";

interface HeadingBlockProps {
  content: string;
  properties: {
    level: string;
    align: string;
    color: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
  };
  onUpdateContent: (content: string) => void;
  isSelected: boolean;
}

export default function HeadingBlock({
  content,
  properties,
  onUpdateContent,
  isSelected
}: HeadingBlockProps) {
  // Simple heading block
  const style = {
    color: properties.color,
    fontSize: properties.fontSize,
    fontWeight: properties.fontWeight,
    padding: properties.padding,
    textAlign: properties.align as any,
  };

  const handleClick = () => {
    if (isSelected) {
      const newContent = prompt("Enter heading text:", content);
      if (newContent !== null) {
        onUpdateContent(newContent);
      }
    }
  };

  return (
    <div onClick={handleClick} style={style}>
      {properties.level === 'h1' && <h1>{content}</h1>}
      {properties.level === 'h2' && <h2>{content}</h2>}
      {properties.level === 'h3' && <h3>{content}</h3>}
      {properties.level === 'h4' && <h4>{content}</h4>}
      {properties.level === 'h5' && <h5>{content}</h5>}
      {properties.level === 'h6' && <h6>{content}</h6>}
      {isSelected && (
        <div className="mt-1 text-xs text-blue-500">
          Click to edit heading text
        </div>
      )}
    </div>
  );
}

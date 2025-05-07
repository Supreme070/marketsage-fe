"use client";

interface SpacerBlockProps {
  properties: {
    height: string;
  };
  isSelected: boolean;
}

export default function SpacerBlock({
  properties,
  isSelected
}: SpacerBlockProps) {
  // Spacer style
  const spacerStyle = {
    height: properties.height,
    display: 'block',
    width: '100%',
  };

  return (
    <div>
      <div style={spacerStyle}></div>
      {isSelected && (
        <div className="text-xs text-blue-500">
          Spacer - {properties.height} high
        </div>
      )}
    </div>
  );
}

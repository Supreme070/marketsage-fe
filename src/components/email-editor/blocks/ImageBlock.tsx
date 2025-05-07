"use client";

interface ImageBlockProps {
  content: {
    src: string;
    alt: string;
  };
  properties: {
    align: string;
    width: string;
    padding: string;
    link: string;
    borderRadius: string;
  };
  onUpdateContent: (content: { src: string; alt: string }) => void;
  isSelected: boolean;
}

export default function ImageBlock({
  content,
  properties,
  onUpdateContent,
  isSelected
}: ImageBlockProps) {
  // Simple image block
  const style = {
    padding: properties.padding,
    textAlign: properties.align as any,
    borderRadius: properties.borderRadius,
  };

  const imageStyle = {
    width: properties.width,
    borderRadius: properties.borderRadius,
    margin: properties.align === 'center' ? '0 auto' :
           properties.align === 'right' ? '0 0 0 auto' : '0 auto 0 0'
  };

  const handleClick = () => {
    if (isSelected) {
      const newSrc = prompt("Enter image URL:", content.src);
      if (newSrc !== null) {
        const newAlt = prompt("Enter alt text:", content.alt);
        if (newAlt !== null) {
          onUpdateContent({
            src: newSrc,
            alt: newAlt
          });
        }
      }
    }
  };

  const renderImage = () => {
    const img = (
      <img
        src={content.src}
        alt={content.alt}
        style={imageStyle}
      />
    );

    if (properties.link) {
      return (
        <a href={properties.link} target="_blank" rel="noopener noreferrer">
          {img}
        </a>
      );
    }

    return img;
  };

  return (
    <div onClick={handleClick} style={style}>
      {renderImage()}
      {isSelected && (
        <div className="mt-1 text-xs text-blue-500">
          Click to edit image
        </div>
      )}
    </div>
  );
}

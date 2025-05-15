import { useEffect, useRef } from "react";

type ScrollObserverProps = {
  onIntersect: (entry: IntersectionObserverEntry) => void;
  threshold?: number | number[];
  rootMargin?: string;
  children: React.ReactNode;
  className?: string;
};

const ScrollObserver = ({
  onIntersect,
  threshold = 0.1,
  rootMargin = "0px",
  children,
  className = "",
}: ScrollObserverProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect(entry);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [onIntersect, rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default ScrollObserver; 
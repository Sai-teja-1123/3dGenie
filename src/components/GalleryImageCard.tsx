import { memo, useState, useRef, useEffect } from "react";

interface GalleryImageCardProps {
  src: string;
  title: string;
  subtitle?: string;
}

const GalleryImageCard = memo(({ src, title, subtitle }: GalleryImageCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-card group cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20">
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={title}
        className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 group-hover:rotate-1 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />

      {/* Loading placeholder */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-primary/10 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
          <h3 className="text-base font-semibold text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
});

GalleryImageCard.displayName = 'GalleryImageCard';

export default GalleryImageCard;




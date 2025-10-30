interface GalleryImageCardProps {
  src: string;
  title: string;
  subtitle?: string;
}

const GalleryImageCard = ({ src, title, subtitle }: GalleryImageCardProps) => {
  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-card group cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20">
      <img
        src={src}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-hover:rotate-1"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-primary/10 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
          <h3 className="text-base font-semibold text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default GalleryImageCard;




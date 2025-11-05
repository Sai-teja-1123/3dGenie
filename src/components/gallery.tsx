import GalleryImageCard from "./GalleryImageCard";

const galleryImages = [
  { id: 1, src: "/src/gallery 3d models/character-knight.png", title: "Knight" },
  { id: 2, src: "/src/gallery 3d models/character-superhero.png", title: "Superhero" },
  { id: 3, src: "/src/gallery 3d models/character-fairy.png", title: "Fairy" },
  { id: 4, src: "/src/gallery 3d models/character-astronaut.png", title: "Astronaut" },
<<<<<<< HEAD
  { id: 7, src: "/src/gallery 3d models/moana_blue.jpeg", title: "Moana" },
  { id: 5, src: "/src/gallery 3d models/one_piece_blue.jpeg", title: "One Piece" },
  { id: 6, src: "/src/gallery 3d models/bossbaby-blue.jpeg", title: "Boss Baby" },
  { id: 8, src: "/src/gallery 3d models/snowwhite_blue.jpeg", title: "Snow White" },
=======
  { id: 7, src: "/src/gallery 3d models/moanabg.jpg", title: "Moana" },
  { id: 5, src: "/src/gallery 3d models/opb.jpeg", title: "One Piece" },
  { id: 6, src: "/src/gallery 3d models/boss_blbg.jpeg", title: "Boss Baby" },
  { id: 8, src: "/src/gallery 3d models/elsabg.jpeg", title: "Elsa" },
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
];

const Gallery = () => {
  // No categories; static reference images

  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Showcase Gallery</h2>
          <p className="text-muted-foreground text-lg">
            See what amazing creations our AI can help you make
          </p>
        </div>

        {/* Category filters removed per requirement */}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {galleryImages.map((img) => (
            <GalleryImageCard key={img.id} src={img.src} title={img.title} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;

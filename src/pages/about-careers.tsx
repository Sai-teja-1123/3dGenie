import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const CareersPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
    <Navbar />
    <main className="container mx-auto px-6 pt-28 pb-16 space-y-6 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold">Careers</h1>
      <p className="text-white/80">We’re hiring artists (Blender/Three.js), React developers, and community managers. Send your portfolio or GitHub to <a href="mailto:careers@aiforge.kids" className="underline">careers@aiforge.kids</a>.</p>
    </main>
    <Footer />
  </div>
);

export default CareersPage;






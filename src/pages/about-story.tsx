import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const OurStory = () => (
  <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
    <Navbar />
    <main className="container mx-auto px-6 pt-28 pb-16 space-y-6 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold">Our Story</h1>
      <p className="text-white/80">AI Forge was started to turn children’s drawings and ideas into delightful characters. We focus on privacy, safety, and playful creativity.</p>
      <p className="text-white/80">From a single prototype to a full Magic Maker pipeline, we’ve helped thousands of parents create unique gifts and school projects for their kids.</p>
    </main>
    <Footer />
  </div>
);

export default OurStory;






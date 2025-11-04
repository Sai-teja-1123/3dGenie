import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MiniModel3D from "@/components/MiniModel3D";

const Product3D = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold">3D Character Maker</h1>
        <p className="text-white/80 max-w-3xl">Turn a photo into a stylized 3D character. Choose male/female, age, model theme, and customize hair/outfit/props before generating your preview.</p>

        <section className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold mb-2">Highlights</h2>
            <ul className="list-disc pl-6 space-y-1 text-white/85">
              <li>Kid-friendly models (male/female) and themes</li>
              <li>Live customization: hair, outfit, shoes, props</li>
              <li>Preview in browser with orbit animation</li>
              <li>Export ready for 3D print or animation</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 flex items-center justify-center">
            <div className="w-full max-w-sm aspect-square">
              <MiniModel3D />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold mb-2">Production & Support</h2>
          <p className="text-sm text-white/80">Need studio-quality assets? Write to <a href="mailto:3d@aiforge.kids" className="underline">3d@aiforge.kids</a> with sample photos and preferred style; we’ll share a delivery timeline and a download link.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Product3D;






import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const Product2D = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold">2D Art Generator</h1>
        <p className="text-white/80 max-w-3xl">Create posters, stickers, coloring pages, and storybook scenes. Upload a child's sketch or photo and stylize it into vibrant 2D artwork. Perfect for party invites, room decor, or learning activities.</p>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold mb-2">What you get</h2>
            <ul className="list-disc pl-6 space-y-1 text-white/85">
              <li>High-res PNG/JPG exports (A4 and square)</li>
              <li>Multiple styles: Cartoon, Watercolor, Comic, Minimalist</li>
              <li>Background removal toggle</li>
              <li>Safe color palette for home printing</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold mb-2">How it works</h2>
            <ol className="list-decimal pl-6 space-y-1 text-white/85">
              <li>Upload a sketch or photo</li>
              <li>Choose style and palette</li>
              <li>Review preview and download</li>
            </ol>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold mb-2">Contact for custom 2D art</h2>
          <p className="text-sm text-white/80">For bulk designs or school projects, email us at <a href="mailto:studio@aiforge.kids" className="underline">studio@aiforge.kids</a> or WhatsApp +91-90000-00000.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Product2D;






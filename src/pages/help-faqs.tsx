import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const faqItems = [
  {
    q: "What exactly do I receive after generating my hero?",
    a: "You receive a print-ready STL file - the universal format for 3D printing. This works with major FDM and resin printers, and you can also send it to local makerspaces, print shops, or online print services.",
  },
  {
    q: "Do you ship physical figures?",
    a: "Physical printing and shipping is currently in private beta. Join our waitlist to be notified when beta opens in your region. Current orders are delivered as digital STL files for self-printing.",
  },
  {
    q: "Is my child's photo safe?",
    a: "Yes. Photos are processed for generation and handled securely. We do not publicly share uploaded photos.",
  },
  {
    q: "What photo gives the best result?",
    a: "A clear, front-facing photo in good lighting gives the best output. Keep the child as the main subject and avoid busy backgrounds for stronger likeness.",
  },
  {
    q: "I don't own a 3D printer. Can I still use 3DGENI?",
    a: "Absolutely. You can send your STL file to a local library or makerspace, a local print shop, or online services. You can also join the waitlist for print-and-ship availability.",
  },
  {
    q: "Are the character styles licensed from major movie/comic brands?",
    a: "No. The styles are original hero-inspired looks designed for personalization and custom creation.",
  },
];

const FAQsPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
    <Navbar />
    <main className="container mx-auto px-6 pt-28 pb-16 max-w-4xl">
      <div className="text-center mb-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/90 mb-2">Common questions</p>
        <h1 className="font-hero text-5xl sm:text-6xl uppercase tracking-wide">FAQs</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
        {faqItems.map((item) => (
          <details key={item.q} className="group px-5 py-4">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base sm:text-lg font-semibold">
              <span>{item.q}</span>
              <span className="text-violet-300 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-white/75 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default FAQsPage;






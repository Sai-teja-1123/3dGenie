import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const FAQsPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
    <Navbar />
    <main className="container mx-auto px-6 pt-28 pb-16 space-y-6 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold">FAQs</h1>
      <div className="space-y-5">
        <div>
          <h2 className="font-semibold">Is my child's photo safe?</h2>
          <p className="text-white/80">Photos are processed for model creation and not shared publicly. You can delete them anytime.</p>
        </div>
        <div>
          <h2 className="font-semibold">How long does 3D generation take?</h2>
          <p className="text-white/80">Usually 1–3 minutes in the browser preview; final exports may take longer depending on complexity.</p>
        </div>
        <div>
          <h2 className="font-semibold">Refunds</h2>
          <p className="text-white/80">If you face technical issues, write to <a href="mailto:support@aiforge.kids" className="underline">support@aiforge.kids</a> within 48 hours.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default FAQsPage;






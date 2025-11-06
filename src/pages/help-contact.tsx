import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const ContactPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
    <Navbar />
    <main className="container mx-auto px-6 pt-28 pb-16 space-y-6 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold">Contact Us</h1>
      <div className="space-y-4 text-white/85">
        <p>Email: <a href="mailto:hello@aiforge.kids" className="underline">hello@aiforge.kids</a></p>
        <p>WhatsApp: +91-90000-00000</p>
        <p>Address: AI Forge Labs, Hyderabad, Telangana</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-semibold mb-2">Frontend reference</h2>
        <p className="text-sm text-white/80">This site is built with React + Vite + Tailwind + three.js. For collaboration or integrations, write to <a href="mailto:dev@aiforge.kids" className="underline">dev@aiforge.kids</a>.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default ContactPage;






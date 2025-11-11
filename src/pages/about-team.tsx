import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const TeamPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
    <Navbar />
    <main className="container mx-auto px-6 pt-28 pb-16 space-y-6 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold">Team</h1>
      <p className="text-white/80">We’re a small team of artists and engineers passionate about children’s creativity, based in Hyderabad and remote.</p>
    </main>
    <Footer />
  </div>
);

export default TeamPage;






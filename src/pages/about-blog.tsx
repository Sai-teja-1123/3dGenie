import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const BlogPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
    <Navbar />
    <main className="container mx-auto px-6 pt-28 pb-16 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6">Blog</h1>
      <div className="space-y-6 text-white/85">
        <article>
          <h2 className="font-semibold text-xl">How we build friendly 3D models</h2>
          <p>We keep proportions cute and safe for children while retaining strong silhouettes that print well. Read more soon…</p>
        </article>
        <article>
          <h2 className="font-semibold text-xl">Tips for great photo uploads</h2>
          <p>Use bright lighting, face in frame, and plain background for the best results. Avoid heavy filters.</p>
        </article>
      </div>
    </main>
    <Footer />
  </div>
);

export default BlogPage;






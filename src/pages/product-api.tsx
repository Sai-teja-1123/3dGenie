import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const ProductAPI = () => {
  const apiSnippet = `POST /v1/2d/style
{ image: <base64>, style: "cartoon" | "watercolor" }

POST /v1/3d/generate
{ image: <base64>, gender: "male"|"female", age: 1-13, colors: {...}, accessory: "ball" }

GET /v1/jobs/:id
{ status: "queued"|"running"|"done", progress: 0-100, resultUrl?: string }`;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold">3DGENI API</h1>
        <p className="text-white/80 max-w-3xl">Integrate 2D stylization and 3D character generation into your own apps. REST endpoints with API key authentication.</p>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="font-semibold">Endpoints</h2>
          <pre className="bg-black/40 p-4 rounded-lg text-xs overflow-auto">{apiSnippet}</pre>
          <p className="text-sm text-white/80">Sandbox keys available on request. Email <a href="mailto:api@aiforge.kids" className="underline">api@aiforge.kids</a>.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProductAPI;



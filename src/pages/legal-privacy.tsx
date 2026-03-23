import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
    <Navbar />
    <main className="container mx-auto px-6 pt-28 pb-16 max-w-4xl space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/90 mb-2">Legal</p>
        <h1 className="font-hero text-5xl sm:text-6xl uppercase tracking-wide">Privacy Policy</h1>
      </div>

      <section className="space-y-6 text-white/80 leading-relaxed">
        <p>
          We value your privacy. This policy explains what information we collect, how we use it, and how we
          protect it when you use 3D GENIE.
        </p>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Information We Collect</h2>
          <p>
            We may collect account details (such as name and email), uploaded images for generation workflows,
            and basic usage data needed to improve reliability and performance.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">How We Use Information</h2>
          <p>
            We use information to provide core features (image generation, 3D processing, downloads), customer
            support, payment processing, and product quality improvements.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Image Handling</h2>
          <p>
            Uploaded images are processed to generate requested outputs. We do not publicly share uploaded
            content. Access is restricted to required systems and workflows.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Data Security</h2>
          <p>
            We use technical and organizational safeguards to protect your data. No method is 100% secure, but
            we continuously improve our security posture.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Your Choices</h2>
          <p>
            You can contact us to request account help or data-related support. For privacy requests, write to{" "}
            <a href="mailto:privacy@aiforge.kids" className="underline text-white">
              privacy@aiforge.kids
            </a>
            .
          </p>
        </div>

        <p className="text-sm text-white/60 pt-2">Last updated: March 2026</p>
      </section>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicyPage;

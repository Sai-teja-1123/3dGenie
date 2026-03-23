import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const TermsOfUsePage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
    <Navbar />
    <main className="container mx-auto px-6 pt-28 pb-16 max-w-4xl space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/90 mb-2">Legal</p>
        <h1 className="font-hero text-5xl sm:text-6xl uppercase tracking-wide">Terms of Use</h1>
      </div>

      <section className="space-y-6 text-white/80 leading-relaxed">
        <p>
          These Terms govern your use of 3D GENIE. By using the service, you agree to these terms.
        </p>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Service Use</h2>
          <p>
            You may use the platform for lawful personal or business purposes in accordance with your selected
            plan and applicable license terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">User Content</h2>
          <p>
            You are responsible for content you upload and must ensure you have rights to use it. Do not upload
            unlawful, harmful, or infringing content.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Generated Output</h2>
          <p>
            Output usage rights depend on your selected plan and license. You are responsible for compliance with
            any local laws or third-party platform requirements.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Payments & Refunds</h2>
          <p>
            Paid services are billed as described at checkout. Refund requests for technical issues are reviewed
            case-by-case by support.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Limitation of Liability</h2>
          <p>
            The service is provided on an as-is basis. To the extent permitted by law, we are not liable for
            indirect or consequential damages arising from use of the platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Contact</h2>
          <p>
            For legal questions, contact{" "}
            <a href="mailto:legal@aiforge.kids" className="underline text-white">
              legal@aiforge.kids
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

export default TermsOfUsePage;

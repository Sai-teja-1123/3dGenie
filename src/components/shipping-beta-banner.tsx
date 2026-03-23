import { useState } from "react";

const ShippingBetaBanner = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const closeWaitlist = () => {
    setShowWaitlist(false);
    setWaitlistEmail("");
    setWaitlistSubmitted(false);
  };

  const submitWaitlist = () => {
    if (!waitlistEmail || !waitlistEmail.includes("@")) return;
    setWaitlistSubmitted(true);
  };

  return (
    <>
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/5 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="text-cyan-300 font-semibold mb-2">🚀 Physical Shipping - Coming Soon (Beta)</div>
              <p className="text-white/70 leading-relaxed">
                We&apos;re working on printing and shipping physical figures directly to your door. Currently in
                private beta. Join the waitlist to be first in line when it opens in your region.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowWaitlist(true)}
              className="shrink-0 rounded-xl bg-cyan-400 text-[#080810] px-7 py-3 font-bold hover:bg-cyan-300 transition-colors"
            >
              Join Waitlist →
            </button>
          </div>
        </div>
      </section>

      {showWaitlist && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-cyan-300/35 bg-[#13131f] p-8 shadow-2xl">
            <button
              type="button"
              onClick={closeWaitlist}
              className="absolute right-4 top-4 text-white/60 hover:text-white text-lg"
              aria-label="Close waitlist"
            >
              ✕
            </button>

            {!waitlistSubmitted ? (
              <>
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="font-hero text-3xl uppercase tracking-wide text-white mb-2">Join The Beta Waitlist</h3>
                <p className="text-sm text-white/65 leading-relaxed mb-5">
                  We&apos;re rolling out physical 3D printing and shipping in select regions. Drop your email
                  and we&apos;ll notify you as soon as it&apos;s available near you.
                </p>
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-white/15 bg-[#1a1a2e] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-cyan-300/60"
                />
                <button
                  type="button"
                  onClick={submitWaitlist}
                  className="mt-3 w-full rounded-lg bg-cyan-400 text-black font-bold px-4 py-3 hover:bg-cyan-300 transition-colors"
                >
                  Notify Me When Available →
                </button>
                <p className="mt-3 text-center text-xs text-white/45">No spam. One email when beta opens in your region.</p>
              </>
            ) : (
              <div className="text-center py-2">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="font-hero text-3xl uppercase tracking-wide text-white mb-2">You&apos;re On The List!</h3>
                <p className="text-sm text-white/60">We&apos;ll email you when physical shipping opens in your region.</p>
                <button
                  type="button"
                  onClick={closeWaitlist}
                  className="mt-5 rounded-lg bg-violet-500 text-white font-semibold px-6 py-2.5 hover:bg-violet-400 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ShippingBetaBanner;

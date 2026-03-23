const stats = [
  { value: "500+", label: "Heroes created" },
  { value: "4.9★", label: "Average rating" },
  { value: "97%", label: "Would reorder" },
];

const reviews = [
  {
    stars: "★★★★★",
    text:
      "\"My son literally cried happy tears when he saw himself as a fire warrior. Best birthday gift I've ever given. The detail on the figure is incredible.\"",
    initial: "P",
    name: "Priya M.",
    meta: "Mother of 2 · Mumbai",
    avatarClass: "bg-orange-400/20 text-orange-300",
  },
  {
    stars: "★★★★★",
    text:
      "\"Ordered three for my twins and their cousin for Christmas. They were fighting over whose figure looked cooler. The quality is way better than I expected.\"",
    initial: "J",
    name: "James K.",
    meta: "Father of 3 · London",
    avatarClass: "bg-cyan-400/20 text-cyan-300",
  },
  {
    stars: "★★★★★",
    text:
      "\"The whole process took 5 minutes. Upload, pick a style, done. The figure arrived in a beautiful gift box. My daughter takes it everywhere she goes.\"",
    initial: "S",
    name: "Sara L.",
    meta: "Mother of 1 · New York",
    avatarClass: "bg-violet-400/20 text-violet-300",
  },
];

const SocialProof = () => {
  return (
    <section className="py-24 px-6 bg-[#090b17] border-y border-white/5">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-violet-300/90">What families are saying</p>
            <h2 className="text-5xl md:text-6xl font-bold uppercase tracking-tighter text-white">
              Real Heroes. Real Reactions.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-extrabold text-white">{stat.value}</div>
                <div className="text-xs text-white/55">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="rounded-2xl border border-white/10 bg-[#101428]/85 p-6 transition-colors hover:border-white/20"
            >
              <div className="mb-3 text-amber-300 text-sm tracking-wide">{review.stars}</div>
              <p className="mb-5 text-white/75 italic leading-relaxed">{review.text}</p>
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${review.avatarClass}`}
                >
                  {review.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{review.name}</p>
                  <p className="text-xs text-white/50">{review.meta}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;

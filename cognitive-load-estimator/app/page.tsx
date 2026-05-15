export default function Home() {
  return (
    <main className="min-h-screen bg-[#1c1c1a] text-[#f4f1ea] px-6 py-16">
      <section className="mx-auto max-w-4xl rounded-xl border border-[#4a4a45] bg-[#2b2b28] px-8 py-14 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#a8a29a]">
          Cognitive Load Estimator
        </p>

        <h1 className="mb-6 text-4xl font-bold tracking-tight">
          How hard is your UI to look at?
        </h1>

        <p className="mx-auto mb-12 max-w-xl text-lg leading-8 text-[#c7c1b8]">
          Upload any screenshot and get an evidence-based cognitive load score
          across five dimensions.
        </p>

        <div className="mx-auto mb-6 flex h-44 max-w-2xl flex-col items-center justify-center rounded-xl border border-dashed border-[#6b6b64] bg-[#242421]">
          <div className="mb-3 text-4xl text-[#a8a29a]">↑</div>

          <p className="text-lg font-semibold text-[#ddd8cf]">
            Drop a screenshot here
          </p>

          <p className="mt-1 text-sm text-[#a8a29a]">
            or paste a URL to analyze live
          </p>
        </div>

        <p className="mb-10 text-sm text-[#918b83]">
          PNG, JPG, or WEBP · up to 10MB · nothing is stored
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <span className="text-[#a8a29a]">Try an example:</span>

          <button className="font-medium text-[#8ab4f8] underline underline-offset-4">
            Airbnb checkout
          </button>

          <button className="font-medium text-[#8ab4f8] underline underline-offset-4">
            Amazon product page
          </button>

          <button className="font-medium text-[#8ab4f8] underline underline-offset-4">
            Google homepage
          </button>
        </div>
      </section>
    </main>
  );
}
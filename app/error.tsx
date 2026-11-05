"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="page">
      <h1>Let’s try that again.</h1>
      <p>
        The observatory could not load. Your source snapshots are preserved.
      </p>
      <button onClick={reset}>Retry</button>
    </main>
  );
}

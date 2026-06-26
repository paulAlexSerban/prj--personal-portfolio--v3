import { Masthead } from "./Masthead";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--newsprint)] text-[var(--ink-black)]">
      <Masthead />
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      <footer className="max-w-6xl mx-auto px-6 py-10 mt-8 border-t-[2px] border-[var(--ink-black)]">
        <p className="smallcaps text-xs text-[var(--slate)] text-center">
          The Review · Printed daily in your browser · Algorithm: SM-2
        </p>
      </footer>
    </div>
  );
}

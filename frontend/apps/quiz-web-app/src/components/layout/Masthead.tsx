import { Link } from "@tanstack/react-router";
import { formatDateline } from "@/utils/dates";

export function Masthead() {
  return (
    <header className="grain border-b-[3px] border-[var(--ink-black)]">
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          <p
            className="smallcaps text-[10px] md:text-sm text-[var(--slate)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Vol. I · No. {Math.floor((Date.now() / 86400000) % 999)}
          </p>
          <p
            className="smallcaps text-[10px] md:text-sm text-[var(--slate)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Spaced Repetition Edition
          </p>
        </div>
        <Link to="/" className="block text-center mt-1 no-underline text-[var(--ink-black)]">
          <h1
            className="font-black tracking-tight leading-none"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 9vw, 6rem)" }}
          >
            The Review
          </h1>
        </Link>
        <div className="rule-double mt-2" />
        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <p className="smallcaps text-[11px] text-[var(--slate)]">{formatDateline()}</p>
          <nav className="flex gap-5 text-[11px] smallcaps flex-wrap">
            <Link to="/" className="hover:underline">
              Posts
            </Link>
            <Link to="/browse" className="hover:underline">
              Questions
            </Link>
            <Link to="/tags" className="hover:underline">
              Tags
            </Link>
            <Link to="/sets" className="hover:underline">
              My Sets
            </Link>
            <Link to="/stats" className="hover:underline">
              Progress
            </Link>
            <Link to="/settings" className="hover:underline">
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

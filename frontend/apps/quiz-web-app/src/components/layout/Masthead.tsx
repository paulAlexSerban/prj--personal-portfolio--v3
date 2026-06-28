import { Link } from "@tanstack/react-router";
import { dayOfYear, formatDateline, isoWeek } from "@/utils/dates";

export function Masthead() {
  const now = new Date();
  const dateline = `Vol. ${__APP_VERSION__} · No. ${dayOfYear(now)}/${isoWeek(now)}`;
  return (
    <header className="grain border-b-[3px] border-ink">
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          <p className="kicker font-mono text-[10px] md:text-sm">{dateline}</p>
          <p className="kicker font-mono text-[10px] md:text-sm">Spaced Repetition Edition</p>
        </div>
        <Link to="/" className="block text-center mt-1 no-underline text-ink">
          <h1 className="font-display font-black tracking-tight leading-none text-[clamp(3rem,9vw,6rem)]">
            The Review
          </h1>
        </Link>
        <div className="rule-double mt-2" />
        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <p className="kicker text-[11px]">{formatDateline()}</p>
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

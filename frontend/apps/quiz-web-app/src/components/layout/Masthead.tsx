import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@prj--personal-portfolio--v3/shared--ui";
import { SiteSwitcher, buildSiteTabs } from "@prj--personal-portfolio--v3/shared--navigation";
import { siteUrls } from "@/lib/urls";
import { dayOfYear, formatDateline, isoWeek } from "@/utils/dates";

const navItems = [
  { to: "/", label: "Posts" },
  { to: "/browse", label: "Questions" },
  { to: "/tags", label: "Tags" },
  { to: "/sets", label: "My Sets" },
  { to: "/stats", label: "Progress" },
  { to: "/settings", label: "Settings" },
] as const;

const siteTabs = buildSiteTabs({
  portfolio: siteUrls.portfolio,
  blog: siteUrls.blog,
  quiz: import.meta.env.BASE_URL,
});

export function Masthead() {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const dateline = `Vol. ${__APP_VERSION__} · No. ${dayOfYear(now)}/${isoWeek(now)}`;
  return (
    <header className="grain border-b-[3px] border-ink">
      <div className="root-box">
        <div className="flex items-center justify-between gap-4">
          <p className="kicker font-mono text-[10px] md:text-sm">{dateline}</p>
          <div className="flex flex-col items-end gap-1">
            <p className="kicker font-mono text-[10px] md:text-sm">Spaced Repetition Edition</p>
            <SiteSwitcher activeSite="quiz" tabs={siteTabs} />
          </div>
        </div>
        <Link to="/" className="block text-center mt-1 no-underline text-ink">
          <h1 className="font-display font-black tracking-tight leading-none text-[clamp(3rem,9vw,6rem)]">
            The Review
          </h1>
        </Link>
        <div className="rule-double mt-2" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="kicker text-[11px]">{formatDateline()}</p>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
                className="md:hidden rounded-none border-ink"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l-[3px] border-ink">
              <SheetHeader>
                <SheetTitle className="kicker text-left text-sm smallcaps">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 smallcaps" aria-label="Primary mobile">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="border-b border-rule py-3 text-base no-underline text-ink hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <nav className="mt-2 hidden flex-wrap gap-5 text-sm smallcaps md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

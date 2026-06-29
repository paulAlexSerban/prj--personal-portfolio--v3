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
import { externalLinkAttrs, siteUrls } from "@/lib/urls";
import { dayOfYear, formatDateline, isoWeek } from "@/utils/dates";

const navItems = [
  { to: "/", label: "Posts" },
  { to: "/browse", label: "Questions" },
  { to: "/tags", label: "Tags" },
  { to: "/sets", label: "My Sets" },
  { to: "/stats", label: "Progress" },
  { to: "/settings", label: "Settings" },
] as const;

export function Masthead() {
  const [open, setOpen] = useState(false);
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

          <nav
            className="hidden md:flex gap-5 text-[11px] smallcaps flex-wrap"
            aria-label="Primary"
          >
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="hover:underline">
                {item.label}
              </Link>
            ))}
            <a
              href={siteUrls.portfolio}
              className="hover:underline"
              {...externalLinkAttrs(siteUrls.portfolio)}
            >
              Portfolio
            </a>
            <a href={siteUrls.blog} className="hover:underline" {...externalLinkAttrs(siteUrls.blog)}>
              Blog
            </a>
          </nav>

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
                <a
                  href={siteUrls.portfolio}
                  onClick={() => setOpen(false)}
                  className="border-b border-rule py-3 text-base no-underline text-ink hover:underline"
                  {...externalLinkAttrs(siteUrls.portfolio)}
                >
                  Portfolio
                </a>
                <a
                  href={siteUrls.blog}
                  onClick={() => setOpen(false)}
                  className="border-b border-rule py-3 text-base no-underline text-ink hover:underline"
                  {...externalLinkAttrs(siteUrls.blog)}
                >
                  Blog
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

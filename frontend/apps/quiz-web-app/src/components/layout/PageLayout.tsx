import { FooterSiteLinks, buildSiteTabs } from "@prj--personal-portfolio--v3/shared--navigation";
import { Masthead } from "./Masthead";
import { siteUrls } from "@/lib/urls";
import { useStore } from "@/store";

const siteTabs = buildSiteTabs({
  portfolio: siteUrls.portfolio,
  blog: siteUrls.blog,
  quiz: import.meta.env.BASE_URL,
});

export function PageLayout({ children }: { children: React.ReactNode }) {
  const scheduler = useStore((s) => s.settings.scheduler);
  const algorithm = scheduler === "fsrs" ? "FSRS-5" : "SM-2";
  return (
    <div className="min-h-screen bg-newsprint text-ink">
      <Masthead />
      <main className="root-box">{children}</main>
      <footer className="root-box mt-8 border-t-[2px] border-ink">
        <div className="mb-3 text-center">
          <FooterSiteLinks activeSite="quiz" tabs={siteTabs} />
        </div>
        <p className="kicker text-sm text-center">
          The Typeset Review · Printed daily in your browser · Algorithm: {algorithm}
        </p>
      </footer>
    </div>
  );
}

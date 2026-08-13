import {
  FooterSiteLinks,
  SocialLinks,
  buildSiteTabs,
} from "@prj--personal-portfolio--v3/shared--navigation";
import { Masthead } from "./Masthead";
import { openOnboarding, openStudyWalkthrough } from "@/onboarding/onboardingState";
import { siteUrls } from "@/lib/urls";
import { useStore } from "@/store";

const siteTabs = buildSiteTabs({
  portfolio: siteUrls.portfolio,
  blog: siteUrls.blog,
  quiz: import.meta.env.BASE_URL,
  news: siteUrls.news,
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
        <div className="kicker mb-2 flex flex-col items-center justify-center gap-3 text-sm">
          <div data-tour-target="footer-social">
            <SocialLinks linkClassName="inline-flex items-center text-ink no-underline text-sm hover:opacity-70" />
          </div>
          <p className="text-center flex flex-col justify-center">
            <span>The Typeset Review</span>
            <span>Printed daily in your browser</span>
            <span>Algorithm: {algorithm}</span>
            <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <button
                type="button"
                data-tour-target="replay-tour"
                className="kicker cursor-pointer border-0 bg-transparent p-0 text-sm text-ink underline decoration-rule underline-offset-2 hover:opacity-70"
                onClick={openOnboarding}
              >
                Replay intro
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                data-tour-target="replay-walkthrough"
                className="kicker cursor-pointer border-0 bg-transparent p-0 text-sm text-ink underline decoration-rule underline-offset-2 hover:opacity-70"
                onClick={openStudyWalkthrough}
              >
                Study walkthrough
              </button>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

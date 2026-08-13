import type { ReactNode } from "react";
import type { Step } from "react-joyride";
import { LINKEDIN_URL } from "@prj--personal-portfolio--v3/shared--navigation";
import { QUIZ_REPO_URL, externalLinkAttrs, siteUrls } from "@/lib/urls";

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function getPrimaryNavTarget(): HTMLElement | null {
  const desktop = document.querySelector<HTMLElement>('[data-tour-target="primary-nav"]');
  if (desktop && isVisible(desktop)) return desktop;
  return document.querySelector<HTMLElement>('[data-tour-target="mobile-nav-button"]');
}

function TourLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-ink underline decoration-rule underline-offset-2"
      {...externalLinkAttrs(href)}
    >
      {children}
    </a>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return <p className="deck m-0 text-sm">{children}</p>;
}

export function buildOnboardingSteps(): Step[] {
  return [
    {
      id: "welcome",
      target: "body",
      placement: "center",
      skipScroll: true,
      title: "Welcome to The Typeset Review",
      content: (
        <Body>
          This is a spaced-repetition quiz built from my writing. Pick posts, add them as study
          sets, then review questions on a schedule so the material actually sticks.
        </Body>
      ),
    },
    {
      id: "local-storage",
      target: "body",
      placement: "center",
      skipScroll: true,
      title: "Everything stays on this device",
      content: (
        <Body>
          Progress, study sets, and settings live only in this browser&apos;s local storage. Nothing
          is sent to a server. Clearing site data, switching browsers, or using another device will
          lose your progress.
        </Body>
      ),
    },
    {
      id: "browse-sets",
      target: getPrimaryNavTarget,
      placement: "bottom",
      title: "Browse and build sets",
      content: (
        <Body>
          Use Posts to add a catalogue item to your collection, My Sets to study what you&apos;ve
          added, and Study to run due cards. Questions, Tags, Progress, and Settings sit alongside
          those.
        </Body>
      ),
    },
    {
      id: "progress",
      target: "body",
      placement: "center",
      skipScroll: true,
      title: "Track your progress",
      content: (
        <Body>
          Reviews are scheduled with SM-2 or FSRS-5 — you can switch in Settings. Open Progress to
          see how many cards are new, due, or already learned.
        </Body>
      ),
    },
    {
      id: "source-material",
      target: "body",
      placement: "center",
      skipScroll: true,
      title: "Source material",
      content: (
        <Body>
          Every question is generated from full articles on{" "}
          <TourLink href={siteUrls.blog}>blog.paulserban.eu</TourLink>. Follow a card back to the
          original post when you want the full context.
        </Body>
      ),
    },
    {
      id: "open-source",
      target: '[data-tour-target="footer-social"]',
      placement: "top",
      title: "Open source and contact",
      content: (
        <Body>
          The code is public:{" "}
          <TourLink href={QUIZ_REPO_URL}>view the GitHub repo</TourLink>. The icons here go to my
          GitHub profile and{" "}
          <TourLink href={LINKEDIN_URL}>LinkedIn</TourLink>.
        </Body>
      ),
    },
    {
      id: "replay",
      target: '[data-tour-target="replay-tour"]',
      placement: "top",
      title: "Replay anytime",
      content: (
        <Body>
          You can run this intro again from the footer whenever you want a refresher.
        </Body>
      ),
    },
  ];
}

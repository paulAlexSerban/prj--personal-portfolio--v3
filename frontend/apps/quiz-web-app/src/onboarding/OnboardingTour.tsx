import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Modal, Stamp } from "@prj--personal-portfolio--v3/shared--ui";
import {
  ACTIONS,
  EVENTS,
  Joyride,
  STATUS,
  type EventData,
  type Options,
  type Step,
  type Styles,
} from "react-joyride";
import { buildOnboardingSteps } from "./onboardingSteps";
import {
  ONBOARDING_OPEN_EVENT,
  STUDY_WALKTHROUGH_OPEN_EVENT,
  readDismissed,
  readWalkthroughDismissed,
  writeDismissed,
  writeWalkthroughDismissed,
} from "./onboardingState";
import {
  buildNothingDueStep,
  buildStudyWalkthroughSteps,
  type WalkthroughStepData,
} from "./studyWalkthroughSteps";
import { useStore } from "@/store";

const INK = "#0d0d0d";
const AGED = "#faf8f3";
const SLATE = "#4a4a4a";

type Phase = "idle" | "intro" | "opt-in" | "walkthrough";

const tourOptions: Partial<Options> = {
  skipBeacon: true,
  showProgress: true,
  buttons: ["back", "skip", "primary"],
  overlayColor: "rgba(13,13,13,0.7)",
  overlayClickAction: false,
  dismissKeyAction: "close",
  blockTargetInteraction: true,
  spotlightRadius: 0,
  spotlightPadding: 8,
  backgroundColor: AGED,
  primaryColor: INK,
  textColor: INK,
  arrowColor: AGED,
  width: 420,
};

const tourLocale = {
  back: "Back",
  next: "Next",
  skip: "Skip tour",
  last: "Got it",
  nextWithProgress: "Next ({current} of {total})",
};

const tourStyles: Partial<Styles> = {
  tooltip: {
    backgroundColor: AGED,
    border: `3px solid ${INK}`,
    borderRadius: 0,
    padding: "1rem 1.25rem",
    fontFamily: "var(--font-body)",
    backgroundImage:
      "radial-gradient(rgba(13, 13, 13, 0.05) 1px, transparent 1px), radial-gradient(rgba(13, 13, 13, 0.03) 1px, transparent 1px)",
    backgroundSize: "3px 3px, 7px 7px",
    backgroundPosition: "0 0, 1px 2px",
  },
  tooltipTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: INK,
    paddingRight: 0,
  },
  tooltipContent: {
    padding: "0.75rem 0 0",
  },
  tooltipFooter: {
    marginTop: "1rem",
  },
  buttonPrimary: {
    backgroundColor: INK,
    color: AGED,
    borderRadius: 0,
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    border: `2px solid ${INK}`,
    padding: "0.6rem 1.1rem",
  },
  buttonBack: {
    color: INK,
    borderRadius: 0,
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  buttonSkip: {
    color: SLATE,
    borderRadius: 0,
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  spotlight: {
    stroke: INK,
    strokeWidth: 3,
  },
};

function waitForAddedIncrease(previousCount: number, timeoutMs = 10000): Promise<void> {
  if (useStore.getState().addedPosts.length > previousCount) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      unsub();
      resolve();
    }, timeoutMs);
    const unsub = useStore.subscribe((s) => {
      if (s.addedPosts.length > previousCount) {
        window.clearTimeout(timeout);
        unsub();
        resolve();
      }
    });
  });
}

export function OnboardingTour() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const clickCleanupRef = useRef<(() => void) | null>(null);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const clearClickWait = useCallback(() => {
    clickCleanupRef.current?.();
    clickCleanupRef.current = null;
  }, []);

  const startIntro = useCallback(() => {
    clearClickWait();
    setPhase("intro");
    setSteps(buildOnboardingSteps());
    setStepIndex(0);
    setRun(true);
  }, [clearClickWait]);

  const startWalkthrough = useCallback(() => {
    clearClickWait();
    const skipAdd = useStore.getState().addedPosts.length > 0;
    setPhase("walkthrough");
    setSteps(buildStudyWalkthroughSteps(navigate, skipAdd));
    setStepIndex(0);
    setRun(true);
  }, [clearClickWait, navigate]);

  const declineWalkthrough = useCallback(() => {
    writeWalkthroughDismissed();
    setPhase("idle");
  }, []);

  useEffect(() => {
    if (!readDismissed()) startIntro();
    const onOpenIntro = () => startIntro();
    const onOpenWalkthrough = () => startWalkthrough();
    window.addEventListener(ONBOARDING_OPEN_EVENT, onOpenIntro);
    window.addEventListener(STUDY_WALKTHROUGH_OPEN_EVENT, onOpenWalkthrough);
    return () => {
      window.removeEventListener(ONBOARDING_OPEN_EVENT, onOpenIntro);
      window.removeEventListener(STUDY_WALKTHROUGH_OPEN_EVENT, onOpenWalkthrough);
    };
  }, [startIntro, startWalkthrough]);

  useEffect(() => () => clearClickWait(), [clearClickWait]);

  const handleEvent = useCallback(
    (data: EventData) => {
      const { action, index, status, step, type } = data;
      const currentPhase = phaseRef.current;

      if (status === STATUS.FINISHED) {
        clearClickWait();
        setRun(false);
        if (currentPhase === "intro") {
          writeDismissed();
          setPhase(readWalkthroughDismissed() ? "idle" : "opt-in");
        } else if (currentPhase === "walkthrough") {
          writeWalkthroughDismissed();
          setPhase("idle");
        } else {
          setPhase("idle");
        }
        return;
      }

      if (action === ACTIONS.CLOSE || status === STATUS.SKIPPED) {
        clearClickWait();
        setRun(false);
        if (currentPhase === "intro") writeDismissed();
        if (currentPhase === "walkthrough") writeWalkthroughDismissed();
        setPhase("idle");
        return;
      }

      if (type === EVENTS.TARGET_NOT_FOUND) {
        if (currentPhase === "walkthrough" && step.id === "the-card") {
          setSteps([buildNothingDueStep()]);
          setStepIndex(0);
          return;
        }
        if (currentPhase === "walkthrough" && step.id === "add-set") {
          toast.error("No posts in the catalogue to add.");
          writeWalkthroughDismissed();
          setRun(false);
          setPhase("idle");
          return;
        }
        if (currentPhase === "walkthrough" && step.id === "your-set") {
          toast.error("No study sets yet. Add a post from the catalogue first.");
          writeWalkthroughDismissed();
          setRun(false);
          setPhase("idle");
          return;
        }
        setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
        return;
      }

      if (type === EVENTS.TOOLTIP) {
        clearClickWait();
        const meta = step.data as WalkthroughStepData | undefined;
        if (!meta?.waitForClick) return;
        const el = document.querySelector(meta.waitForClick);
        if (!el) return;
        const onClick = () => {
          el.removeEventListener("click", onClick);
          clickCleanupRef.current = null;
          const previousCount = useStore.getState().addedPosts.length;
          void (async () => {
            if (meta.waitForAdd) await waitForAddedIncrease(previousCount);
            setStepIndex((i) => i + 1);
          })();
        };
        el.addEventListener("click", onClick);
        clickCleanupRef.current = () => el.removeEventListener("click", onClick);
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        clearClickWait();
        setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      }
    },
    [clearClickWait],
  );

  return (
    <>
      {steps.length > 0 && (
        <Joyride
          continuous
          run={run}
          stepIndex={stepIndex}
          steps={steps}
          scrollToFirstStep={false}
          onEvent={handleEvent}
          options={tourOptions}
          locale={tourLocale}
          styles={tourStyles}
        />
      )}
      <Modal
        open={phase === "opt-in"}
        onClose={declineWalkthrough}
        title="Try a first review?"
      >
        <p className="deck m-0 text-sm">
          Optional walkthrough: add a post to My Sets, start a session, reveal a card, and rate it.
          Everything still stays in this browser.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Stamp onClick={startWalkthrough} title="Start the hands-on study walkthrough">
            Yes, walk me through it
          </Stamp>
          <Stamp
            variant="ghost"
            onClick={declineWalkthrough}
            title="Skip the study walkthrough for now"
          >
            Not now
          </Stamp>
        </div>
      </Modal>
    </>
  );
}

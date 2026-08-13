import type { Step } from "react-joyride";
import { Body } from "./onboardingSteps";

export type WalkthroughStepData = {
  waitForClick?: string;
  waitForAdd?: boolean;
};

export type WalkthroughNavigate = (opts: { to: "/" | "/sets" }) => Promise<void> | void;

const clickStep = {
  buttons: ["skip"] as Step["buttons"],
  blockTargetInteraction: false,
};

const waitForPage = {
  targetWaitTimeout: 8000,
};

export function buildNothingDueStep(): Step {
  return {
    id: "nothing-due",
    target: "body",
    placement: "center",
    skipScroll: true,
    title: "Nothing due today",
    content: (
      <Body>
        This set has no cards waiting right now. New cards and scheduled reviews show up here when
        they are due. You can add another post from the catalogue, or come back later.
      </Body>
    ),
  };
}

export function buildStudyWalkthroughSteps(
  navigate: WalkthroughNavigate,
  skipAdd: boolean,
): Step[] {
  const addSteps: Step[] = skipAdd
    ? []
    : [
        {
          id: "lets-review",
          target: "body",
          placement: "center",
          skipScroll: true,
          title: "Let's do one real review",
          content: (
            <Body>
              Next you will add a post to My Sets, start a session, reveal a card, and rate it.
              Click the highlighted control at each step — nothing is sent to a server.
            </Body>
          ),
          before: async () => {
            await navigate({ to: "/" });
          },
        },
        {
          id: "add-set",
          target: '[data-tour-target="add-first-set"]',
          placement: "bottom",
          title: "Add a post to My Sets",
          content: (
            <Body>
              Click <strong>Add to Study Set</strong>. Every question from that post joins your
              local collection. Progress stays in this browser.
            </Body>
          ),
          ...clickStep,
          ...waitForPage,
          data: {
            waitForClick: '[data-tour-target="add-first-set"]',
            waitForAdd: true,
          } satisfies WalkthroughStepData,
        },
        {
          id: "saved-local",
          target: "body",
          placement: "center",
          skipScroll: true,
          title: "Saved on this device",
          content: (
            <Body>
              The set is in your collection now. Questions are loaded from this site&apos;s static
              data; your membership and later ratings never leave the browser.
            </Body>
          ),
        },
      ];

  return [
    ...addSteps,
    {
      id: "your-set",
      target: '[data-tour-target="walkthrough-set"]',
      placement: "top",
      title: "Your set",
      content: (
        <Body>
          <strong>New</strong> cards have never been reviewed. <strong>Due</strong> means ready
          today. <strong>Total</strong> is everything in the set, including ignored cards.
        </Body>
      ),
      ...waitForPage,
      before: async () => {
        await navigate({ to: "/sets" });
      },
    },
    {
      id: "start-study",
      target: '[data-tour-target="study-first-set"]',
      placement: "bottom",
      title: "Start studying",
      content: (
        <Body>
          Click <strong>Study</strong> to open a session of cards that are due now. One card at a
          time, scheduled by SM-2 or FSRS.
        </Body>
      ),
      ...clickStep,
      data: {
        waitForClick: '[data-tour-target="study-first-set"]',
      } satisfies WalkthroughStepData,
    },
    {
      id: "the-card",
      target: '[data-tour-target="study-card"]',
      placement: "left",
      title: "The card",
      content: (
        <Body>
          This is one question. The counter is this session only. Bury, Suspend, and Ignore are
          optional extras — skip them for now.
        </Body>
      ),
      ...waitForPage,
    },
    {
      id: "pick-option",
      target: '[data-tour-target="pick-option"]',
      placement: "top",
      title: "Pick an answer",
      content: (
        <Body>
          Multiple-choice cards need an option first. Click any choice — the walkthrough continues
          after you pick.
        </Body>
      ),
      ...clickStep,
      data: {
        waitForClick: '[data-tour-target="pick-option"]',
      } satisfies WalkthroughStepData,
    },
    {
      id: "reveal-card",
      target: '[data-tour-target="reveal-card"]',
      placement: "top",
      title: "Reveal the answer",
      content: (
        <Body>
          Click <strong>Show Answer</strong> or <strong>Submit</strong>. Written cards just reveal;
          multiple-choice cards are graded against the key.
        </Body>
      ),
      ...clickStep,
      data: {
        waitForClick: '[data-tour-target="reveal-card"]',
      } satisfies WalkthroughStepData,
    },
    {
      id: "explain-reveal",
      target: "body",
      placement: "center",
      skipScroll: true,
      title: "What you just revealed",
      content: (
        <Body>
          Read the solution. Rating comes next — that is how the scheduler decides when this card
          should return.
        </Body>
      ),
    },
    {
      id: "rate-card",
      target: '[data-tour-target="rate-card"]',
      placement: "top",
      title: "Qualify the card",
      content: (
        <Body>
          <strong>Again</strong> brings it back soon. <strong>Hard</strong> shortens the interval,{" "}
          <strong>Good</strong> is the normal step, <strong>Easy</strong> stretches it. Click one.
        </Body>
      ),
      ...clickStep,
      data: {
        waitForClick: '[data-tour-target="rate-card"]',
      } satisfies WalkthroughStepData,
    },
    {
      id: "walkthrough-done",
      target: "body",
      placement: "center",
      skipScroll: true,
      title: "That review is saved locally",
      content: (
        <Body>
          The rating and next due date live in this browser&apos;s local storage. Keep going with
          the next card, or leave whenever you like. Replay this walkthrough from the footer.
        </Body>
      ),
    },
  ];
}

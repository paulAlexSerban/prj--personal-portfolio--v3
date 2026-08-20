export const ONBOARDING_OPEN_EVENT = "quiz-web-app:open-onboarding";
export const ONBOARDING_DISMISSED_KEY = "quiz-web-app:onboarding-dismissed-v1";

export const STUDY_WALKTHROUGH_OPEN_EVENT = "quiz-web-app:open-study-walkthrough";
export const STUDY_WALKTHROUGH_DISMISSED_KEY = "quiz-web-app:study-walkthrough-dismissed-v1";

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Private mode / blocked storage - still close the tour.
  }
}

export function readDismissed(): boolean {
  return readFlag(ONBOARDING_DISMISSED_KEY);
}

export function writeDismissed(): void {
  writeFlag(ONBOARDING_DISMISSED_KEY);
}

export function openOnboarding(): void {
  window.dispatchEvent(new Event(ONBOARDING_OPEN_EVENT));
}

export function readWalkthroughDismissed(): boolean {
  return readFlag(STUDY_WALKTHROUGH_DISMISSED_KEY);
}

export function writeWalkthroughDismissed(): void {
  writeFlag(STUDY_WALKTHROUGH_DISMISSED_KEY);
}

export function openStudyWalkthrough(): void {
  window.dispatchEvent(new Event(STUDY_WALKTHROUGH_OPEN_EVENT));
}

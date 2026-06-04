# Feature Requiremtns - Spaced Repetition Behavior

## Overview

The quiz system uses the SM-2 spaced repetition algorithm, matching the scheduling behaviour and rating model of Anki. **Every question slug is one SRS card** regardless of `answer_format` or `cognitive_style`. Scheduling is identical across the widget, web app, and mobile app.

Question **content** types are defined in [`types-of-questions.md`](../01%20spikes/types-of-questions.md). This PRD covers **scheduling and review UX** only.

## SM-2 and rating (all questions)

| ID    | Requirement                                                                                                                                             | Priority  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| SR-01 | The quiz system MUST schedule card reviews using the SM-2 algorithm                                                                                     | Must Have |
| SR-02 | The user MUST rate each card on a four-point scale: Again, Hard, Good, Easy                                                                             | Must Have |
| SR-03 | A card rated "Again" MUST be rescheduled for review within the same session                                                                             | Must Have |
| SR-04 | Cards with higher ease ratings MUST receive longer intervals before next review than cards rated lower                                                  | Must Have |
| SR-05 | A new card seen for the first time MUST be presented before any previously reviewed cards in the same session                                           | Must Have |
| SR-06 | Only cards due for review on or before today MUST appear in a session by default                                                                        | Must Have |
| SR-07 | The scheduling behaviour MUST be consistent across the widget, web app, and mobile app — the same card state produces the same schedule on all surfaces | Must Have |

Ratings always reflect **recall quality after the review step**, not raw correctness alone. For auto-graded cards, the user still chooses Again/Hard/Good/Easy after seeing whether their selection was correct.

## Grading mode (aligned with question content)

| ID    | Requirement                                                                                                                                                                     | Priority    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| SR-08 | Questions with `grading_mode: auto` (`multiple_choice`, `multiple_select`, `true_false`) MUST require a user selection before revealing the explanation                         | Must Have   |
| SR-09 | Questions with `grading_mode: auto` MUST determine correctness in the client before the SM-2 rating step                                                                        | Must Have   |
| SR-10 | Questions with `grading_mode: self` (`answer_format: free_text`) MUST let the user attempt recall, then reveal the model answer, then require an Again/Hard/Good/Easy rating    | Must Have   |
| SR-11 | Self-graded cards MUST use the same SM-2 state machine and storage key (`questionSlug`) as auto-graded cards                                                                    | Must Have   |
| SR-12 | LLM-assisted grading for `free_text` is out of scope for v0.1; self-graded flow MUST remain fully functional when LLM grading is added later without breaking stored card state | Should Have |

**Future (v0.3+):** optional LLM feedback on `free_text` answers may supplement self-grading; SM-2 scheduling and slug-based state remain unchanged.

## References

- Question taxonomy: [`01 spikes/types-of-questions.md`](../01%20spikes/types-of-questions.md)
- MDX authoring: [`01 spikes/migrating-question-mdx-content.md`](../01%20spikes/migrating-question-mdx-content.md)

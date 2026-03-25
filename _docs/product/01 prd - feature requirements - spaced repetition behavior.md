# Feature Requiremtns - Spaced Repetition Behavior

## Overview

The quiz system uses the SM-2 spaced repetition algorithm, matching the scheduling behaviour and rating model of Anki. This section defines the required user-facing behaviour; algorithm implementation details are in the Architecture Document.

| ID    | Requirement                                                                                                                                             | Priority  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| SR-01 | The quiz system MUST schedule card reviews using the SM-2 algorithm                                                                                     | Must Have |
| SR-02 | The user MUST rate each card on a four-point scale: Again, Hard, Good, Easy                                                                             | Must Have |
| SR-03 | A card rated "Again" MUST be rescheduled for review within the same session                                                                             | Must Have |
| SR-04 | Cards with higher ease ratings MUST receive longer intervals before next review than cards rated lower                                                  | Must Have |
| SR-05 | A new card seen for the first time MUST be presented before any previously reviewed cards in the same session                                           | Must Have |
| SR-06 | Only cards due for review on or before today MUST appear in a session by default                                                                        | Must Have |
| SR-07 | The scheduling behaviour MUST be consistent across the widget, web app, and mobile app — the same card state produces the same schedule on all surfaces | Must Have |

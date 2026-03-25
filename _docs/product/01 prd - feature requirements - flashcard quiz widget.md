# Feature Requiremtns - Flashcard Quiz Widget

## Overview

A lazily loaded UI component embedded in each blog post page. Allows readers to immediately start a quiz session for the post they just read, without navigating away. Opens as a modal overlay.

| ID     | Requirement                                                                                                | Priority    |
| ------ | ---------------------------------------------------------------------------------------------------------- | ----------- |
| WGT-01 | The widget MUST render a visible trigger icon in the blog post layout                                      | Must Have   |
| WGT-02 | Clicking the trigger MUST open a modal overlay containing the quiz session                                 | Must Have   |
| WGT-03 | The widget MUST automatically scope the quiz session to the questions associated with the current post     | Must Have   |
| WGT-04 | The widget MUST initialise new questions (not yet seen by the user) with a default spaced repetition state | Must Have   |
| WGT-05 | The widget MUST resume from existing user progress — showing only cards due for review                     | Must Have   |
| WGT-06 | The widget MUST support the full rating interface: Again, Hard, Good, Easy                                 | Must Have   |
| WGT-07 | The widget MUST be lazily loaded and MUST NOT block page render or Largest Contentful Paint                | Must Have   |
| WGT-08 | The widget MUST be closeable via a close button and the Escape key without losing session progress         | Must Have   |
| WGT-09 | The widget SHOULD display a session summary screen when all due cards have been reviewed                   | Should Have |
| WGT-10 | The widget SHOULD show a badge on the trigger icon indicating the number of cards due for the current post | Should Have |

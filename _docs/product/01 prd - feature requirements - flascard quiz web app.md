# Feature Requiremtns - Flashcard Quiz Widget

## Overview

A standalone web application providing the full quiz experience across all of the user's study sets. Also serves as the source codebase for the mobile app. Must function as an offline-capable PWA.

| ID     | Requirement                                                                                                            | Priority    |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | ----------- |
| WEB-01 | The quiz web app MUST be accessible at a dedicated URL, independent of the blog                                        | Must Have   |
| WEB-02 | The user MUST be able to browse all available posts and add them to their personal study set                           | Must Have   |
| WEB-03 | Adding a post MUST add all of its associated questions to the user's card deck                                         | Must Have   |
| WEB-04 | Adding a post to the study set MUST be additive — previously reviewed cards are not reset                              | Must Have   |
| WEB-05 | Removing a post from the study set MUST NOT delete the user's progress on its questions                                | Must Have   |
| WEB-06 | The user MUST be able to run a quiz session with SM-2 rating (Again, Hard, Good, Easy)                                 | Must Have   |
| WEB-07 | The user MUST be able to view a progress screen showing: total cards, cards due today, and upcoming review schedule    | Must Have   |
| WEB-08 | The user MUST be able to mark individual questions as ignored; ignored questions are excluded from all future sessions | Must Have   |
| WEB-09 | All user state MUST be read from and persisted to client storage on every interaction                                  | Must Have   |
| WEB-10 | The web app MUST function offline as a PWA                                                                             | Must Have   |
| WEB-11 | The web app SHOULD support a "study all due cards" mode across all added study sets                                    | Should Have |
| WEB-12 | The web app COULD allow the user to reset all progress for a given post or globally                                    | Could Have  |

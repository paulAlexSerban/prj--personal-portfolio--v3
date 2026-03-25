# Feature Requiremtns - User Learning State

## Overview

All user progress is stored locally on the user's device. There is no account, login, or remote sync in v0.1. The state model must be robust enough to survive app updates and support a future migration path to server-side sync.

IDRequirementPriorityST-01All user state MUST be stored client-side — no data is sent to a serverMST-02The user's card progress MUST persist across browser sessions, app restarts, and device rebootsMST-03The user's study sets (added posts) MUST persist across sessionsMST-04The user's ignored questions MUST persist across sessionsMST-05Removing a post from the study set MUST NOT remove card progress for that post's questionsMST-06The state schema MUST be versioned to support forward-compatible migrations in future releasesMST-07The storage implementation MUST be abstracted so it can be swapped between browser storage (web) and native device storage (mobile) without changes to quiz logic

| ID    | Requirement                                                                                                                                                       | Priority  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| ST-01 | All user state MUST be stored client-side — no data is sent to a server                                                                                           | Must Have |
| ST-02 | The user's card progress MUST persist across browser sessions, app restarts, and device reboots                                                                   | Must Have |
| ST-03 | The user's study sets (added posts) MUST persist across sessions                                                                                                  | Must Have |
| ST-04 | The user's ignored questions MUST persist across sessions                                                                                                         | Must Have |
| ST-05 | Removing a post from the study set MUST NOT remove card progress for that post's questions                                                                        | Must Have |
| ST-06 | The state schema MUST be versioned to support forward-compatible migrations in future releases                                                                    | Must Have |
| ST-07 | The storage implementation MUST be abstracted so it can be swapped between browser storage (web) and native device storage (mobile) without changes to quiz logic | Must Have |

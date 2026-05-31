# DRAFT
| **Mobile**            | Capacitor (Ionic)           | Web-first; single codebase for iOS + Android; no React Native overhead  
Capacitor over React Native
**Decision:** Wrap the Vite SPA in Capacitor rather than building a separate React Native app.
**Rationale:** The quiz app has no requirements that demand native UI components. Capacitor lets the same React codebase run on web, iOS, and Android. No separate native codebase to maintain.
**Trade-off:** Native feel is slightly less polished than a fully native app. Accepted for v0.1.
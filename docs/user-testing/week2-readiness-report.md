# Week 2 readiness report: Concert Experience UX & accessibility

- **Branch:** `feature/week2-ux-accessibility`, based on `origin/main` (`e107f53`, PR #1 merge)
- **Scope:** Live Concert, At-home Concert, experience selection, and production deploy paths. The landing page was not changed.

## Evidence levels

The first two levels are evidence from our own testing. The last one is what we will learn from real participants.

| Level | Meaning |
|---|---|
| **Reproduced** | Reproduced in a real browser (headless Chrome 131 or Chrome 92) against the production build at a 390×844 touch viewport. The probe script is described below. |
| **Code review** | Inferred by reading the code. This is a hypothesis until a participant runs into it. |
| **User-confirmed** | Seen in a moderated session. **There are none yet.** No user sessions have been run. |

Nothing below has been tested on a physical iPhone or Android phone, or with VoiceOver or TalkBack. Halo, the venue backend and the wearable are all simulated. No finding assumes real hardware.

## Fixed on this branch

Each fix addresses a crash or an accessibility blocker that was reproduced before the fix and verified after it.

| ID | Problem | Evidence (before → after) | Fix |
|---|---|---|---|
| **FIX-01** | At-home Concert showed a **blank screen** on Chrome < 97 and iOS/macOS Safari < 15.4. `Array.prototype.findLastIndex` threw an error during render. Vite's default build target (Chrome 87 / Safari 14) does not polyfill it, and there is no error boundary to catch the failure. | Chrome 92: `TypeError: t.sections.findLastIndex is not a function`, with no `h1` and no `<video>` rendered → page renders, video present, no errors. The new `intensityAt` gives identical output to the old one across 20,501 time samples. | Replaced with a loop in `aurabeat/lib/beat.ts`. Also replaced `Object.hasOwn` in `aurabeat/live/liveBridge.ts`, which needs the same browser versions. That second path only runs with a real backend, so the change is preventive. |
| **FIX-02** | With the full-screen lightstick open and **no element full screen available** (iPhone Safari), Tab moved focus onto the **hidden** At-home and Exit buttons behind the overlay. Keyboard and Switch Control users lost track of where focus was, and could trigger a mode switch they couldn't see. | Full screen disabled: Tab sequence `Stop → [browser] → At-home → Exit` (outside the dialog) → `Stop → [browser] → Exit lightstick → Stop` (stays inside). | The page content is now `inert` while the lightstick is open (`aurabeat/pages/LiveConcert.tsx`), and the lightstick moved out of that container. |
| **FIX-03** | Screen readers were sent **"BASS, Heavy low end" every 2 seconds** for as long as live mode ran. With the lightstick open, the message went out from **two** live regions at once, so it was announced twice. This made the screen impractical to use with a screen reader while a show was running. | 2 live regions, with "BASS" re-written into them every 2 s → 1 live region, which announces only section changes (BUILD / CHORUS / DROP, about every 8 s). | `LiveCueDisplay` now has an `announce` prop and a single screen-reader-only live region that skips BASS. The visible cue words are unchanged. |

## Open issues (not fixed, prioritized)

| ID | Priority | Evidence | Issue | Recommended fix |
|---|---|---|---|---|
| **UX-01** | High | Reproduced | When the user enters Live or At-home, **focus lands on `<body>`**. The selection screen moves focus to its `h1`, but the concert pages don't, so screen-reader users get no confirmation that the page changed. | In `ScreenHeader`, give the `h1` `tabIndex={-1}` and focus it on mount, the same way `ExperienceShell` does. |
| **UX-02** | High | Reproduced (axe `color-contrast`, serious) | The demo/safety disclaimer on the selection screen (`text-stone-500`, 12 px) has about **4.1:1** contrast. WCAG AA requires 4.5:1. This text is the notice that safety features aren't real. | Change it to `text-stone-400`. This is a one-line change. |
| **UX-03** | High | Code review | The first Wave moment starts at **1:16**. A phone user who presses Play sees "Wave moments light up during the hooks" and nothing else to do for 76 s. There is a risk they give up before the core interaction. | Measure this in Task 4 (time and assists). If confirmed, show "First wave at 1:16" with a jump-to button, or a countdown. |
| **UX-04** | High | Code review | On phones the prompt says **"Wave with the music. Move your wrist to the beat."** No wearable is connected, so wrist movement does nothing. Only tapping counts. Participants may shake the phone, fail, and conclude the feature is broken. | When no wearable is connected, change the prompt to "Tap the Wave button on the beat". Validate in Task 4. |
| **UX-05** | Medium | Code review | Live mode has three ways to leave: "Exit" (header), "Exit lightstick", and "Stop". Users may not understand that "Exit lightstick" keeps the show running. | Observe in Task 2. Possible fix: rename to "Back to controls (show keeps running)". |
| **UX-06** | Medium | Reproduced | Touch targets under 44 px: the **seek slider is 8 px tall**, and the "Concert video" / "Virtual stage" toggles are 40 px tall. | Give the slider a larger hit area (`h-11` wrapper with a styled track). Make the toggles `min-h-11`. |
| **UX-07** | Medium | Reproduced (axe `landmark-one-main`, `region`) | The concert pages have no `<main>` landmark, so screen-reader users can't jump straight to the content. | Wrap the page body in `<main>` in `LiveConcert` and `AtHomeConcert`. |
| **UX-08** | Medium | Reproduced | Any runtime error in a concert page shows a **blank page with no way back**, as FIX-01 showed. There is no React error boundary. | Wrap the lazy concert routes in a small error boundary that shows a message and a "Back" button. |
| **UX-09** | Medium | Reproduced | Reduce Motion and High Contrast chosen inside the concert stay set on `<html>` after returning to the landing page. Reduce Motion then **turns off every landing-page animation**. This may be the intended behaviour. | Product decision: either keep it as a site-wide preference and say so in the UI, or clear the attributes when leaving the concert. |
| **UX-10** | Medium | Code review | The selection screen loads two hero JPEGs of **725 KB and 1.03 MB** (seven JPEGs of 0.6–1.1 MB in total). This is slow on mobile data. | Serve WebP/AVIF versions at about 1200 px wide and add `loading="lazy"` / `decoding="async"`. |
| **UX-11** | Low | Code review | On phones, At-home announces "Wave with the music" with `aria-live="assertive"`. This interrupts lyric announcements and may be disruptive. | Check in the screen-reader session. Consider switching to `polite`. |
| **OPS-01** | Low | Code review | Production loads Tailwind from `cdn.tailwindcss.com` at runtime. The CDN itself advises against production use. It adds a third-party dependency and can cause a flash of unstyled content on slow networks. | Move to build-time Tailwind. This is a larger change and isn't needed for Week 2. |
| **OPS-02** | Low | Code review | `deploy.yml` runs `npm install` without a `package-lock.json` (the repo only has `bun.lock`), so dependency versions can drift between deploys. | Commit a `package-lock.json` and use `npm ci`. |

## Deployment & production asset paths: ✅ OK

- `vite.config.ts` sets `base: '/Tavy/'`, which matches the repository name.
- Hash routing means no server rewrites are needed.
- Build-time images are hashed and placed under `/Tavy/assets/`.
- The video URLs are built with `import.meta.env.BASE_URL` and resolve to `/Tavy/media/grateful.{mp4,webm}`. Both return **206 with the correct MIME type and Range support**, so seeking works.
- The deployed site `https://jasmita09.github.io/Tavy/` returns 200, and `media/grateful.mp4` returns 206 `video/mp4`.
- A full probe run of the production build found **0 failed requests and 0 console errors**.
- The repository has no absolute `/media` or `/src` paths.

## Validation run on this branch

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ builds |
| Automated tests | ⚠️ The repo has **no test suite** and no `test` script. Validation used a headless-browser probe instead (Chrome 131 and Chrome 92, 390×844 touch viewport, axe-core 4.10). The probe covered: Live start → lightstick → Tab containment → Escape → controls → browser Back stops the session (0 vibrations afterwards); At-home load → tap before Play ("Press play first") → play → seek to the wave → tap scored (Perfect, 266 points) → restart. |
| Horizontal overflow at 390 px | ✅ none on any concert screen |

## Not verified (cover these in user tests)

- Real iOS Safari and Android Chrome, including the full-screen, wake-lock and autoplay policies on actual devices.
- Phone vibration. iPhone browsers don't support it, so Android is required.
- VoiceOver and TalkBack behaviour, including the FIX-03 announcements.
- Whether participants understand the simulated-demo framing.

## Ready for user testing?

**Yes, with conditions.** The crash and the two accessibility blockers are fixed. UX-01 and UX-02 are quick wins worth landing before the screen-reader sessions. UX-03, UX-04 and UX-05 are the main hypotheses the five tasks are designed to test. Use the test script and the feedback template in this folder.

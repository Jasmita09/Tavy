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

Each problem was reproduced before the fix and verified after it. FIX-01 to FIX-03 are a crash and two accessibility blockers. UX-01 and UX-02 are quick accessibility wins, landed before the screen-reader sessions.

| ID | Problem | Evidence (before → after) | Fix |
|---|---|---|---|
| **FIX-01** | At-home Concert showed a **blank screen** on Chrome < 97 and iOS/macOS Safari < 15.4. `Array.prototype.findLastIndex` threw an error during render. Vite's default build target (Chrome 87 / Safari 14) does not polyfill it, and there is no error boundary to catch the failure. | Chrome 92: `TypeError: t.sections.findLastIndex is not a function`, with no `h1` and no `<video>` rendered → page renders, video present, no errors. The new `intensityAt` gives identical output to the old one across 20,501 time samples. | Replaced with a loop in `aurabeat/lib/beat.ts`. Also replaced `Object.hasOwn` in `aurabeat/live/liveBridge.ts`, which needs the same browser versions. That second path only runs with a real backend, so the change is preventive. |
| **FIX-02** | With the full-screen lightstick open and **no element full screen available** (iPhone Safari), Tab moved focus onto the **hidden** At-home and Exit buttons behind the overlay. Keyboard and Switch Control users lost track of where focus was, and could trigger a mode switch they couldn't see. | Full screen disabled: Tab sequence `Stop → [browser] → At-home → Exit` (outside the dialog) → `Stop → [browser] → Exit lightstick → Stop` (stays inside). | The page content is now `inert` while the lightstick is open (`aurabeat/pages/LiveConcert.tsx`), and the lightstick moved out of that container. |
| **UX-01** | When the user entered Live or At-home, **focus landed on `<body>`**, so screen-reader users got no confirmation that the page changed. | Focus was on `BODY` → focus is on `H1 Live Concert` / `H1 At-home Concert` after navigation and after a mode switch. Focus stays on the control the user operated during ordinary interactions (toggles, Wave, Exit lightstick). | `ScreenHeader` focuses its `h1` (`tabIndex=-1`) once on mount. `index.css` hides the focus ring on such headings, because they aren't controls. |
| **UX-02** | The simulated-demo/safety disclaimer had about **4.1:1** contrast, below WCAG AA (4.5:1). | axe `color-contrast`: 1 serious violation → 0. | Changed `text-stone-500` to `text-stone-400` in `ExperienceSelect`. |
| **FIX-03** | Screen readers were sent **"BASS, Heavy low end" every 2 seconds** for as long as live mode ran. With the lightstick open, the message went out from **two** live regions at once, so it was announced twice. This made the screen impractical to use with a screen reader while a show was running. | 2 live regions, with "BASS" re-written into them every 2 s → 1 live region, which announces only section changes (BUILD / CHORUS / DROP, about every 8 s). | `LiveCueDisplay` now has an `announce` prop and a single screen-reader-only live region that skips BASS. The visible cue words are unchanged. |

## Open issues (not fixed, prioritized)

| ID | Priority | Evidence | Issue | Recommended fix |
|---|---|---|---|---|
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

**Yes.** The crash, the two accessibility blockers, UX-01 and UX-02 are fixed. UX-03, UX-04 and UX-05 are left in place on purpose. They are the main hypotheses the five tasks are designed to test. Use the test script and the feedback template in this folder.

## After the test build (`b2e0858`)

On request, the following changes landed **after** the test build. Sessions run on `6910c7b` still measure the original UX-03 to UX-05 behaviour, so record the SHA on every feedback form.

- **UX-03:** a countdown to the next wave moment and a "Jump to next wave" button. Both use the track's own wave timing.
- **UX-04:** without a wearable, the prompts say "Tap the Wave button on the beat". Results now show as Perfect/Great/Good, or **Miss** when a wave moment plays out without a tap. Score calculation is unchanged.
- **UX-06**, **UX-07** and **UX-08** are fixed: 44 px touch targets, `<main>` landmarks, and an error boundary on the concert routes.
- **Verification:** 32/32 wave and accessibility checks passed (seek, pause, restart, keyboard, Reduce Motion, 320/390 px layouts, axe with no landmark, region or contrast violations, and a blocked-chunk error screen), plus the 26/26 five-task walkthrough.
- **UX-05** is unchanged.

## Test build

| | |
|---|---|
| **Tested commit** | `6910c7bbc05e378dd824893a37305685e1248b26` (`6910c7b`). Any later commits on this branch change only `docs/`. Check with `git diff --stat 6910c7b HEAD -- . ':!docs'`, which should print nothing. |
| **Build check** | The served build's `/Tavy/BUILD_SHA.txt` returns `6910c7b`. |
| **Five-task walkthrough** | 26/26 automated checks passed against `https://<LAN-IP>:4443/Tavy/`: all five tasks, UX-01, UX-02, FIX-01 to FIX-03, 0 failed requests and 0 console errors. Chrome 131 at a 390×844 touch viewport. |
| **Not the deployed site** | `https://jasmita09.github.io/Tavy/` still serves `main` (`e107f53`), which has **none** of the Week 2 fixes. Don't use it for these sessions. |

### Launching the exact build

These steps assume a Mac, with the phone on the same Wi-Fi network.

```bash
SHA=6910c7b
DIR=/tmp/tavy-$SHA
rm -rf "$DIR" && mkdir -p "$DIR"
git -C ~/Downloads/Tavy-main archive "$SHA" | tar -x -C "$DIR"
ln -s ~/Downloads/Tavy-main/node_modules "$DIR/node_modules"
(cd "$DIR" && npx vite build && echo "$SHA" > dist/BUILD_SHA.txt)

# self-signed HTTPS certificate for this Mac's LAN IP (valid for 14 days)
IP=$(ipconfig getifaddr en0)
openssl req -x509 -newkey rsa:2048 -nodes -days 14 -subj "/CN=TAVY test" \
  -addext "subjectAltName=IP:$IP,DNS:localhost" -keyout "$DIR/key.pem" -out "$DIR/cert.pem"
cat > "$DIR/https.config.mjs" <<EOF
import fs from "node:fs";
export default { base: "/Tavy/", preview: { host: true, port: 4443, strictPort: true,
  https: { key: fs.readFileSync("$DIR/key.pem"), cert: fs.readFileSync("$DIR/cert.pem") } } };
EOF
(cd "$DIR" && npx vite preview --config https.config.mjs)
```

- Open `https://<IP>:4443/Tavy/` on the phone and accept the certificate warning once.
  - Chrome: **Advanced → Proceed**.
  - Safari: **Show Details → visit this website**.
- Before each participant, open `https://<IP>:4443/Tavy/BUILD_SHA.txt` and check that it shows the tested SHA.
- `git archive` builds the committed tree, so uncommitted edits in the working copy can't leak into the test build.

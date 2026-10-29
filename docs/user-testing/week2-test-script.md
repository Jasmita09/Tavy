# TΛVY Concert Experience: Week 2 user test script

**Length:** about 20 minutes per participant  
**Moderator materials:** this script, one copy of [feedback-template.md](./feedback-template.md) per participant, and a timer

## Before the session

- **Device:** the participant's own phone if possible. Record the model, OS version and browser.
- **URL:** the HTTPS LAN build of the tested commit (see "Running a session" below). Don't use the deployed site: it serves `main`, which doesn't have the Week 2 fixes.
- **Build check:** open `/Tavy/BUILD_SHA.txt` and write the SHA on the feedback form.
- Turn the phone's sound on and set the volume to a medium level. Make sure the phone is not in silent mode.
- Clear the site's data before each session. Settings are saved on the device, so the previous participant's choices would otherwise carry over.
- Tell the participant:
  > "We're testing the product, not you. Please think out loud. I can't help during the tasks, but there's no wrong answer. Everything is a demo: no wristband, venue or real concert is connected."

## Moderator rules

- Read each task aloud exactly as written. Do not name buttons the participant hasn't found yet.
- Start the timer when you finish reading the task. Stop it when the participant says they're done or gives up.
- If the participant is stuck for **90 seconds**, give one hint and mark the task **Assisted**.
- Write down what they **do**, not only what they say. Note quotes word for word.
- Record a problem as **Observed** only when you saw it in this session. Don't copy it from the known-issue list.

## Tasks

### Task 1: Find the concert experience
> "You've heard TΛVY lets you experience a concert on your phone. Starting from this page, get to the place where you'd pick how to watch a concert."

- **Start:** landing page (`/Tavy/`)
- **Success:** the "Where are you watching tonight?" screen is showing.
- **Watch for:** where they look first, and whether they scroll past the entry point.

### Task 2: Use your phone as a lightstick at a live show
> "Imagine you're at a concert right now. Turn your phone into a lightstick. Then, after a few seconds, go back to the settings without ending the show. Finally, end it completely."

- **Start:** experience selection screen
- **Success:** the participant opens Live Concert, starts live mode, leaves the lightstick while the session is still running, and then presses **Stop**.
- **Watch for:** whether they understand the difference between "Exit lightstick" and "Stop", whether they notice the BASS/BUILD/CHORUS/DROP words, and whether they notice vibration (Android only).

### Task 3: Make it comfortable for you
> "Suppose flashing lights bother you and you don't want your phone to vibrate. Change the Live Concert so it works that way."

- **Start:** Live Concert screen
- **Success:** **Reduce Motion** is on and **Haptics** is off.
- **Watch for:** whether they find the settings below the main button, and whether they believe the change took effect.

### Task 4: Wave along with a concert at home
> "Now you're watching from home. Watch the concert and join in when the concert asks you to."

- **Start:** any concert screen. They may switch modes or go back.
- **Success:** a wave is scored, and the Score and Waves counts go above 0.
- **Moderator note:** the first wave moment starts at about **1:16** in the video. If the participant hasn't found it within 90 seconds, you may say "you can move through the video", and mark the task Assisted.
- **Watch for:** whether they understand "Get ready" and "Wave with the music" on a phone, and whether they try to physically wave the phone instead of tapping.

### Task 5: Set it up your way, then leave
> "Turn the lyrics off, switch to the other way of viewing the performance, then start the song over. When you're done, go back to where you choose how to watch."

- **Start:** At-home Concert
- **Success:** lyrics are hidden, **Virtual stage** is selected, playback restarts from 0:00, and the participant ends on the experience selection screen.
- **Watch for:** whether they find "Your senses & accessibility", and whether they understand what "Simulated" means.

## Wrap-up questions (about 3 minutes)

1. In your own words, what's the difference between Live Concert and At-home Concert?
2. Was anything confusing, uncomfortable or surprising?
3. What did you think the phone would do that it didn't?
4. On a scale of 1 to 10, how likely are you to try this at a real concert, and why?

## Running a session

1. Start the exact test build over HTTPS. The commands are in [week2-readiness-report.md → Launching the exact build](./week2-readiness-report.md#launching-the-exact-build).
2. Put the phone on the same Wi-Fi as the Mac and open `https://<Mac LAN IP>:4443/Tavy/`.
3. Accept the self-signed certificate warning once, before the participant arrives.
4. Start Task 1 at `/Tavy/`.

> HTTPS matters: phones treat a plain `http://` LAN address as insecure and may block some browser features. Vibration works only in Android browsers; iPhone browsers don't support it.

## Accessibility sessions (optional, one participant each)

- **Screen reader:** VoiceOver (iOS) or TalkBack (Android). Run Tasks 2 and 4.
- **Keyboard or Switch Control:** run Task 2 on a laptop or tablet with a keyboard.
- **Reduce Motion set in the OS:** confirm the lightstick doesn't flash.

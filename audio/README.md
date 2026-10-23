# Climber Audio
Include `<script src="audio/audio.js"></script>`; use `window.CLIMB_AUDIO`. All sounds procedural (Web Audio). Unlocks on first touch/click; resumes on visibility change. Every call is safe before init/unlock (silently ignored).
- `init()` – create audio context and hook unlock listeners
- `setMasterVolume(v)` – master volume 0..1
- `mute(bool)` – mute/unmute
- `surface('rock'|'snow'|'ice')` – sets surface; changes grip() and footstep() sound
- `iceAxe()` – ice axe strike
- `crampon()` – crampon bite into ice/snow
- `grip(strength)` – hand grabbing rock, 0..1
- `slip()` – hand/foot sliding off
- `footstep()` – boot on rock
- `chalk()` – chalk puff
- `ropeFeed()` – rope zipping through
- `clip()` – carabiner snap
- `cam()` – cam clicking into crack
- `camPop()` – gear ripping out (+ pebbles)
- `nut()` – nut seating
- `belayCatch(force)` – rope jolt 0..1; stops any fall sound
- `fall()` – one-shot fall: whoosh + pebbles; auto-stops on belayCatch()/land() (or after 8 s)
- `fallWhoosh(true|false)` – manual start/stop of fall whoosh
- `pebbles(count?)` – falling stones
- `land()` – landing thud; stops any fall sound
- `breathing(effort)` – continuous, heavier/faster with effort 0..1 and with altitude (set via wind())
- `heartbeat(level)` – continuous heartbeat for low stamina 0..1 (0 = off)
- `wind(meters)` – continuous wind, louder/gustier from 5300 m to 8849 m; thin harsh howl above ~7000 m
- `weather('clear'|'rain'|'storm')` – rain/storm layers, storm adds thunder
- `setMusicIntensity(v)` – generative ambient pad intensity 0..1
- `summit()` – uplifting summit sting
- `isUnlocked()` – true once audio is running

Made by Nova Labs ⭐

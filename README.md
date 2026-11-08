# Dochița — interactive intercom prop

A full-screen smart video intercom for the **Palatul Regal** scene. A tablet becomes the device: a brushed-graphite housing, a camera lens with an LED ring, a live front-camera picture with face-scanning overlays, a backlit keypad, and a speaker grille. A director or operator drives the scene from a second device at `/control`.

All on-device text is in Romanian.

| Route      | What it is                                                                           |
| ---------- | ------------------------------------------------------------------------------------ |
| `/`        | The intercom. Open it full-screen on the tablet.                                     |
| `/control` | Director / operator console. Open it on a laptop, a phone or a second tablet.        |

---

## 1. Quick start (development)

Requirements: **Node.js 20.19+** (Node 24 recommended; `.nvmrc` is included).

```sh
nvm use            # or install Node 24
npm install
npm run dev        # http://localhost:3000  and  http://localhost:3000/control
```

`npm run dev` starts one server that runs both the Next.js app and the WebSocket relay (`/ws`). The terminal prints the addresses for the tablet and the operator.

On the first screen choose **Mod demonstrativ** if you don't need the camera. It shows a simulated picture and never asks for camera permission.

---

## 2. On-set setup (recommended)

Run everything from one laptop on the set's Wi-Fi (or a travel router). This setup needs no internet connection and no cloud services.

```sh
npm install
npm run cert       # one-time: HTTPS certificate for the local network
npm run build
npm start          # prints https://<laptop-ip>:3000/ and /control
```

### Why HTTPS?
Browsers only allow the camera on `https://` or `localhost`. `npm run cert` creates `certs/key.pem` + `certs/cert.pem`, and the server picks them up automatically.

- **If [mkcert](https://github.com/FiloSottile/mkcert) is installed** (best): the certificate is trusted. To avoid any warning on the tablet, install mkcert's root CA there too (`mkcert -CAROOT` shows where it is; AirDrop or email `rootCA.pem` to the iPad and enable it under *Settings → General → About → Certificate Trust Settings*).
- **Otherwise openssl is used**: the tablet shows a one-time warning. Choose *Advanced → Proceed* (Chrome) or *Show details → visit this website* (Safari).
- Re-run `npm run cert` if the laptop's IP address changes.
- `HTTPS=0 npm start` forces plain HTTP. The camera will not work, but demo mode will.

### Tablet
1. Open `https://<laptop-ip>:3000/`.
2. Choose **Cameră reală**, keep **Ecran complet** and **Menține ecranul aprins** on, then tap **Pornește interfonul**. That tap is the user gesture that unlocks sound, fullscreen, wake lock and the camera prompt. Allow the camera.
3. *(Recommended)* Install it as an app:
   - **iPad:** Share → *Add to Home Screen*. It then opens without Safari's address bar. Use *Guided Access* (Settings → Accessibility) to lock the tablet into the app.
   - **Android/Chrome:** ⋮ → *Install app*. It opens full-screen. Use *Screen pinning* to lock it.
4. Turn off auto-lock / screen timeout as a backup to the wake lock. Set brightness to maximum.

### Operator
Open `https://<laptop-ip>:3000/control` on any device. The header shows **Server conectat** and **Interfon online**, plus the tablet's camera and audio status.

> If the header says **Audio: atingeți tableta**, tap the tablet once. Browsers only allow sound after a touch.

### Hidden technician menu (on the tablet)
**Press and hold the "PALATUL REGAL" logo for 3 seconds.** From there you can restart the camera, switch between camera and demo mode, toggle fullscreen, brightness and sound, and reset the scene. Actors can't open it by accident.

---

## 3. Running the scene

Nothing advances on a timer: every beat is triggered by the operator, so actors can pause, improvise or repeat. The sequence follows the screenplay *„Balul de Revelion TV8 — Cenușăreasa zilelor noastre”*, Sc. 2 and Sc. 3. Dochița's lines are spoken live by the voice actor (V.O.).

**Filming mode (default):** the screen shows only what a real device would show, meaning short statuses and instructions ("Față nerecunoscută", "Zâmbiți", "Tentativă de deteriorare"). The jokes are only heard, never read first, because the screen changes a moment before the voice speaks. For rehearsals, the console switch *Text complet pe ecran* shows Dochița's whole line instead. The table below lists the spoken lines; the console card shows both "Dochița:" (heard) and "Pe ecran:" (shown). The console shows each beat's cue (the King's line or stage direction) and the line to expect next.

| #  | Cue (screenplay)                                   | Dochița (voice)                                                                   | LED          |
| -- | -------------------------------------------------- | --------------------------------------------------------------------------------- | ------------ |
|    | **Sc. 2 — Intrarea palatului**                     |                                                                                   |              |
| 1  | Regele urcă treptele                               | *(silent)* Bun venit!                                                             | dim          |
| 2  | „Se aprinde un inel luminos.”                      | *(silent)* Detectare facială                                                      | blue scan    |
| 3  | „Dochița, deschide ușa.”                           | Bună ziua. Față nerecunoscută.                                                    | red          |
| 4  | Șterge obiectivul: „Amu mă vezi?”                  | Da. Problema nu era la claritate.                                                 | red          |
| 5  | „Sunt regele!”                                     | Ocupația nu ține loc de identitate. Ieri a venit un domn care era împărat. Vindea covoare. | red |
| 6  | „Uită-te la coroană!”                              | Accesoriile se pot cumpăra. Vă rog să scoateți coroana.                          | amber        |
| 7  | Scoate coroana                                     | Apropiați-vă.                                                                     | blue         |
| 8  | Se apropie                                         | Puțin la stânga.                                                                  | blue         |
| 9  | Se mută greșit                                     | Cealaltă stângă.                                                                  | amber        |
| 10 | Dosarul îi alunecă                                 | Zâmbiți.                                                                          | blue scan    |
| 11 | Zâmbet rigid                                       | Fără amenințări, vă rog.                                                          | amber        |
| 12 | „Așa zâmbesc eu!”                                  | Atunci încercăm întrebarea de securitate. Cine conduce în această casă?          | amber        |
| 13 | „EU!”                                              | Răspuns greșit. Mai aveți două încercări.                                         | red          |
| 14 | (încet) „Regina.”                                  | Corect.                                                                           | green        |
| 15 | *(same breath)*                                    | Verificare de prezență: clipiți de două ori.                                      | blue scan    |
| 16 | Clipește ostentativ                                | Acum întoarceți capul.                                                            | blue scan    |
| 17 | „Dacă nu deschizi, îți întorc eu capul!”           | Eu nu am. Pe al dumneavoastră încerc să-l identific.                              | blue scan    |
| 18 | „Sunt viu, sunt eu, îngheț! Deschide odată!”       | Identitatea este aproape confirmată. Mai lipsește codul primit pe telefon.        | amber        |
| 19 | „Mi s-a descărcat.”                                | Puteți încărca telefonul în hol.                                                  | amber        |
| 20 | „Și în hol cum intru?”                             | Cu codul primit pe telefon.                                                       | red          |
| 21 | Ridică mapa să lovească                            | Reparația costă mai mult decât mine.                                              | red          |
| 22 | Bocănește în ușă                                   | Ce faceți?                                                                        | amber        |
|    | **Sc. 3 — În palat**                               |                                                                                   |              |
| 23 | Regina: „Nu răcni!…” — Ușa se deblochează          | *(silent)* ACCES PERMIS · UȘĂ DEBLOCATĂ + unlock animation                        | green pulse  |
| 24 | Prințul se apropie de ieșire                       | Doriți să-i permit ieșirea, Majestate?                                            | amber        |
| 25 | „Da. Cât trăiesc eu decid.”                        | Doamna Regină, confirmați?                                                        | amber        |
| 26 | „Pe ăsta douăzeci la sută l-am plătit?”            | De la întâi noiembrie plătesc toți. Este ordinul Dvs., Majestate.                 | blue         |
| 27 | „Eu am zis să-i jupuim pe toți…”                   | Declarație înregistrată și publicată. Doriți să activez comentariile?             | green        |

After beat 27 the King's „Dochiță, eu te mîn…” is cut off (TĂIETURĂ), so there's no device reaction.

Beats 18–22 show the code field. To change wording, edit `src/features/intercom/constants/scenes.ts`; `screenplay.test.ts` checks that it still matches the screenplay.

**The door never opens on its own.** Codes typed on the keypad in beats 18–22 are rejected (*Cod incorect*) unless the operator turns on **Deblocare din tastatură** (default code `1225`).

### Console controls
- **Înapoi / Înainte / Deblochează / Resetare**, or click any beat in *Scenariu* to jump straight to it.
- **Inel LED:** on/off, or force any colour. *Auto* follows the scene.
- **Efecte:** a one-off scan, success or failure animation (about 2 s) over the current beat.
- **Mesaj personalizat:** put any text on the device for improvised lines; there are also quick presets. It clears when the beat changes or when you press Esc.
- **Sunete:** automatic scene sounds on/off, master mute, and buttons to play each sound by hand.
- **Afișaj:** high-brightness mode for bright sets (stronger LED ring and text).
- **Live preview** of exactly what the tablet shows.
- **Confirmat / Comanda nu a fost confirmată** tells you whether the tablet applied your last command.

### Keyboard shortcuts (console)
| Key                  | Action                     |
| -------------------- | -------------------------- |
| → / Space / PageDown | Next beat                  |
| ← / PageUp           | Previous beat              |
| Shift + R            | Reset scene                |
| U                    | Unlock door                |
| S / G / F            | Scan / success / failure   |
| L                    | LED ring on/off            |
| M                    | Mute                       |
| A                    | Automatic sounds           |
| B                    | High brightness            |
| Esc                  | Clear custom message       |

PageUp/PageDown mean a standard **presentation clicker** works as a remote.

On the intercom, a USB/Bluetooth keyboard types on the keypad: digits, Enter = ✓, Esc = ✕, Backspace deletes one digit.

### Between takes
Press **Resetare** (or Shift+R). It returns to beat 1 and clears LED and message overrides, but keeps sound and brightness settings.

---

## 4. Reliability behaviour

- **The tablet is the source of truth.** Operator commands are applied on the tablet by the same state machine the keypad uses. The tablet then publishes its state back to the consoles.
- **Network drops:** the tablet keeps showing its current beat and reconnects automatically (exponential back-off, heartbeat detection of dead Wi-Fi, instant retry when the network or screen comes back). The *REȚEA* LED on the device blinks amber while it reconnects. The console shows a red banner.
- **Accidental reload / crash:** the state is saved locally, so the tablet comes back on the same beat without the start screen. On the first touch it re-requests fullscreen and wake lock. An error boundary silently restarts the UI instead of showing an error.
- **Camera:** prefers the front camera and mirrors it. It is released while the page is hidden, re-acquired when visible, and restarted if the track ends or the camera is busy. If the camera is denied or missing, a simulated picture is shown. **Errors never appear on the device**; they show up in the technician menu and on the console.
- **No browser chrome or interactions:** no text selection, callouts, pinch-zoom, double-tap zoom, pull-to-refresh or context menu. A service worker caches the app, so a Wi-Fi blip during a reload still loads it.
- **Reduced motion** is respected: large movement is removed, and state colours stay.

---

## 5. Deployment options

### A. Self-hosted (recommended for filming)
`npm run build && npm start` on any machine with Node. This is one process that serves the app and the WebSocket relay. A laptop on set, a mini PC or a VPS behind HTTPS all work.

### B. Serverless (e.g. Vercel) + separate relay
Serverless functions can't hold WebSocket connections, so run the small relay somewhere always-on and point the app at it:

```sh
# on a VPS / Fly.io / Render / Railway (behind HTTPS → wss://)
PORT=8787 npm run relay

# build the app with
NEXT_PUBLIC_SYNC_URL=wss://relay.example.com/ws
```

The relay holds no authoritative state, only the last snapshot so a console can render immediately when it joins. Losing or restarting it never changes what the tablet shows.

> On a serverless host, `npm start` / `server/index.mjs` is not used. The platform serves the Next.js app, and the relay runs elsewhere.

### Environment variables
| Variable               | Default            | Meaning                                         |
| ---------------------- | ------------------ | ----------------------------------------------- |
| `PORT`                 | `3000`             | Server port                                     |
| `HOST`                 | `0.0.0.0`          | Bind address                                    |
| `HTTPS`                | auto               | `0` forces HTTP even if certificates exist      |
| `HTTPS_KEY/HTTPS_CERT` | `certs/*.pem`      | Custom certificate paths                        |
| `NEXT_PUBLIC_SYNC_URL` | same host + `/ws`  | External relay URL (build-time)                 |

> **Security note:** the console has no login. Anyone on the same network who opens `/control` can drive the device. Use a private Wi-Fi network on set.

---

## 6. Testing

```sh
npm run typecheck   # TypeScript (strict)
npm run lint        # ESLint
npm test            # Vitest unit + integration tests
npm run test:e2e    # Playwright: layout, keypad, operator sync, camera
npm run check       # typecheck + lint + unit tests
```

- **Unit tests:** scene transitions, reset behaviour, operator commands, sound selection, keypad logic, input validation, console shortcuts.
- **Integration:** a real relay server and real WebSocket clients. Covers command forwarding, state mirroring, presence, late-joining consoles, and reconnects.
- **End-to-end (Playwright, Chromium):** the device fits without scrolling or overlap on nine tablet sizes in both orientations (iPad mini to iPad Pro, 8″/10″ Android). Also covers keypad touch and keyboard input, the full console-to-tablet round trip, state surviving a reload, the live camera (Chromium's fake device), and the denied-camera fallback.

The first time, run `npx playwright install chromium`. The e2e suite starts its own dev server on port 3210 (override with `E2E_PORT`).

---

## 7. Project structure

```
server/
  index.mjs              Next.js + WebSocket relay on one port (HTTPS aware)
  relay.mjs              The relay (forwards commands → intercom, state → consoles)
  relay-standalone.mjs   Relay-only server for serverless deployments
src/
  app/                   Routes: / (intercom), /control, manifest, icons, error boundaries
  features/
    intercom/
      constants/scenes.ts   The script: every beat, its text, LED, overlays, sound
      lib/state-machine.ts  Pure reducer + sound derivation + view selector
      lib/keypad.ts         Pure keypad logic
      lib/validation.ts     Guards for network input and restored state
      lib/store.ts          Small synchronous store
      hooks/                Store/persistence, remote sync, keyboard input
      components/           Housing, lens/LED, display, overlays, keypad, boot, tech menu
    camera/                 useCamera hook, live feed, simulated feed
    audio/                  Web Audio synthesiser (no audio files) + unlock hook
    scene-control/          Protocol, self-healing WebSocket client, console UI
  shared/                   Storage, fullscreen, wake-lock, long-press, clock, styles
e2e/                        Playwright tests
```

To change wording or add a beat, edit `src/features/intercom/constants/scenes.ts`. The console, the device and the tests all pick it up from there.

## 8. Known limitations

- **iPad Safari in the browser** has no real fullscreen for web pages. Use *Add to Home Screen* (it opens without browser UI) together with Guided Access.
- **Wake lock** needs iOS 16.4+ or a recent Chrome. Otherwise disable auto-lock in the tablet settings.
- **Sound** can only start after a touch on the tablet (browser policy). The start button covers this; after a reload, touch the tablet once.
- **Face recognition is simulated by design.** Overlays follow the scene, not the actor's actual face position, so frame the shot with the actor's face in the on-screen oval.

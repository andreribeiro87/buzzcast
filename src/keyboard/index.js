// keyboard/index.js — platform-agnostic keyboard backend selector.
//
// Each backend exposes init() (binds the OS library), down(token) and up(token).
// Importing the backends has NO side effects — the OS library is only opened inside
// init() — so all three can be bundled into every compiled binary and only the
// matching one is ever activated at runtime.

import * as windows from "./windows.js";
import * as linux from "./linux.js";
import * as macos from "./macos.js";

const BACKENDS = { win32: windows, linux: linux, darwin: macos };

let backend = null;

export function initKeyboard() {
  const impl = BACKENDS[process.platform];
  if (!impl) {
    console.error(`[keyboard] unsupported platform: ${process.platform}`);
    return;
  }
  try {
    impl.init();
    backend = impl;
    console.log(`[keyboard] backend ready: ${process.platform}`);
  } catch (e) {
    console.error(`[keyboard] init failed (${process.platform}):`, e.message);
  }
}

// How long a tap holds the key down. Emulators don't queue key events for the Buzz
// pad: PCSX2 and RPCS3 read the *current* button level each time the game polls
// (every few ms up to once per frame, 16–33 ms). A down+up sent back to back (<1 ms)
// falls between polls and the game never sees it. ~80 ms is a quick human tap and
// spans several frames even at 30 fps; the down edge (what timing depends on) is
// still sent immediately.
const HOLD_MS = 80;
const held = new Map();   // token → release timer

export function tapToken(token) {
  if (!backend || !token) return;
  const pending = held.get(token);
  if (pending) clearTimeout(pending);   // already down: just keep holding it
  else backend.down(token);
  held.set(token, setTimeout(() => { held.delete(token); backend.up(token); }, HOLD_MS));
}

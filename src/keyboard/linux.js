// keyboard/linux.js — X11 keyboard injection via bun:ffi → libXtst / libX11
//
// Uses the XTEST extension (XTestFakeKeyEvent) to synthesise key presses into the
// focused window. Requires an X11 session and libXtst installed (Debian/Ubuntu:
// `libxtst6`). Wayland sessions do NOT expose XTEST — for those a different path
// (uinput / ydotool) is needed; see CLAUDE.md.
//
// Tokens: a single char (mapped to an X11 keysym; for printable ASCII the keysym
// equals the Unicode code point) or "#XX" = raw Win32 VK in hex, translated to the
// matching X11 keysym via VK_TO_KEYSYM so saved keymaps stay cross-platform.

// Win32 virtual-key (the "#XX" tokens the Keybinds UI can produce) → X11 keysym.
const VK_TO_KEYSYM = {
  0x08: 0xff08, // Backspace
  0x09: 0xff09, // Tab
  0x0d: 0xff0d, // Return
  0x1b: 0xff1b, // Escape
  0x20: 0x0020, // Space
  0x2e: 0xffff, // Delete
  0x2d: 0xff63, // Insert
  0x24: 0xff50, // Home
  0x23: 0xff57, // End
  0x21: 0xff55, // Prior (PageUp)
  0x22: 0xff56, // Next (PageDown)
  0x25: 0xff51, // Left
  0x26: 0xff52, // Up
  0x27: 0xff53, // Right
  0x28: 0xff54, // Down
};

let X11 = null, Xtst = null, display = null;

export function init() {
  const { dlopen, FFIType, ptr, CString } = require("bun:ffi");
  const x11 = dlopen("libX11.so.6", {
    XOpenDisplay:     { args: [FFIType.cstring], returns: FFIType.ptr },
    XKeysymToKeycode: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.u8 },
    XFlush:           { args: [FFIType.ptr], returns: FFIType.i32 },
  });
  const xtst = dlopen("libXtst.so.6", {
    XTestFakeKeyEvent: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u64], returns: FFIType.i32 },
  });
  X11 = x11.symbols; Xtst = xtst.symbols;
  display = X11.XOpenDisplay(null);
  if (!display) throw new Error("XOpenDisplay failed (no X11 display / Wayland?)");
}

function keycode(token) {
  const ks = token[0] === "#"
    ? VK_TO_KEYSYM[parseInt(token.slice(1), 16)]
    : token.charCodeAt(0);                 // printable ASCII keysym == code point
  return ks ? X11.XKeysymToKeycode(display, BigInt(ks)) : 0;   // 0 = not on this keyboard
}

function send(token, isPress) {
  if (!display) return;
  const code = keycode(token);
  if (!code) return;
  Xtst.XTestFakeKeyEvent(display, code, isPress ? 1 : 0, 0n);
  X11.XFlush(display);
}

// Press and release are separate so keyboard/index.js can hold the key down.
export function down(token) { send(token, true); }
export function up(token)   { send(token, false); }

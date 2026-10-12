// keyboard/windows.js — Win32 keyboard injection via bun:ffi → user32.dll
//
// Why bun:ffi and not PowerShell Add-Type? Add-Type -MemberDefinition compiles
// inline C# at runtime via csc.exe, dropping a randomly-named, UNSIGNED DLL into
// %TEMP% that P/Invokes keybd_event. AV heuristics flag that (random unsigned temp
// DLL + input-injection API) as a keylogger. bun:ffi binds to the already-signed
// system user32.dll: no compilation, no temp DLL, no subprocess, lower latency.
//
// Tokens: a single char (resolved layout-aware via VkKeyScanW) or "#XX" = raw
// Win32 virtual-key code in hex (e.g. "#08" = Backspace), sent by scancode.

const VK_SHIFT = 0x10;
const KEYEVENTF_SCANCODE = 0x0008;
const KEYEVENTF_KEYUP = 0x0002;
const MAPVK_VK_TO_VSC = 0;

let user32 = null;
let shiftScan = 0;

export function init() {
  const { dlopen, FFIType } = require("bun:ffi");
  user32 = dlopen("user32.dll", {
    keybd_event:    { args: [FFIType.u8, FFIType.u8, FFIType.u32, FFIType.u64], returns: FFIType.void },
    VkKeyScanW:     { args: [FFIType.u16],              returns: FFIType.i16 },
    MapVirtualKeyW: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
  }).symbols;
  shiftScan = user32.MapVirtualKeyW(VK_SHIFT, MAPVK_VK_TO_VSC);
}

// Resolve a token to { vk, sc, shift } (null if the char isn't typeable on this layout).
function resolve(token) {
  let vk, shift = false;
  if (token[0] === "#") vk = parseInt(token.slice(1), 16);
  else {
    const res = user32.VkKeyScanW(token.charCodeAt(0));
    vk = res & 0xff;
    if (vk === 0xff) return null;
    shift = (res & 0x100) !== 0;
  }
  return { vk, sc: user32.MapVirtualKeyW(vk, MAPVK_VK_TO_VSC), shift };
}

// Press and release are separate so keyboard/index.js can hold the key down long
// enough for emulators that sample the pad state once per poll/frame.
export function down(token) {
  const k = user32 && resolve(token);
  if (!k) return;
  if (k.shift) user32.keybd_event(VK_SHIFT, shiftScan, KEYEVENTF_SCANCODE, 0n);
  user32.keybd_event(k.vk, k.sc, KEYEVENTF_SCANCODE, 0n);
}

export function up(token) {
  const k = user32 && resolve(token);
  if (!k) return;
  user32.keybd_event(k.vk, k.sc, KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP, 0n);
  if (k.shift) user32.keybd_event(VK_SHIFT, shiftScan, KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP, 0n);
}

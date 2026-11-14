export const PATTERNS = [
  { id: "black", name: "Black", kind: "solid", color: "#000000", hint: "Bright specks here are stuck pixels." },
  { id: "white", name: "White", kind: "solid", color: "#ffffff", hint: "Dark specks here are dead pixels." },
  { id: "red", name: "Red", kind: "solid", color: "#ff0000", hint: "Look for pixels that stay dark or shift toward another primary." },
  { id: "green", name: "Green", kind: "solid", color: "#00ff00", hint: "Look for pixels that stay dark or shift toward another primary." },
  { id: "blue", name: "Blue", kind: "solid", color: "#0000ff", hint: "Look for pixels that stay dark or shift toward another primary." },
  { id: "flash", name: "Stuck pixel", kind: "flash", hint: "A stuck pixel keeps its colour while the field blinks. Skip ahead if flashing light affects you.", stillHint: "Reduced motion is on, so this is a still black and white split. A speck that does not match its half is stuck." },
  { id: "ramp-h", name: "Horizontal ramp", kind: "ramp-h", hint: "Bands or steps in the ramp mean uneven backlight or bad colour steps." },
  { id: "ramp-v", name: "Vertical ramp", kind: "ramp-v", hint: "Bands or steps in the ramp mean uneven backlight or bad colour steps." },
  { id: "bars", name: "Colour bars", kind: "bars", hint: "Each bar should be flat. A speck that breaks one bar is a bad pixel." },
  { id: "grid-black", name: "Grid on black", kind: "grid", base: "#000000", line: "#ffffff", hint: "Lines are one device pixel of full white. Missing intersections are dropped pixels." },
  { id: "grid-white", name: "Grid on white", kind: "grid", base: "#ffffff", line: "#000000", hint: "Lines are one device pixel of full black. Broken lines are dropped or stuck pixels." },
];

// Grid pitch in CSS pixels. The canvas converts it to whole device pixels.
export const GRID_PITCH = 8;

// 1-based position of the flashing plate, so copy never hardcodes it.
export const FLASH_PLATE = PATTERNS.findIndex((pattern) => pattern.kind === "flash") + 1;

export const BAR_COLOURS = [
  "#ffffff",
  "#ffff00",
  "#00ffff",
  "#00ff00",
  "#ff00ff",
  "#ff0000",
  "#0000ff",
  "#000000",
];

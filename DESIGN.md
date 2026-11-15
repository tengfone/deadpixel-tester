---
name: Dead pixel tester
description: A contact sheet of the real test plates, then one plate owning the whole screen.
colors:
  paper: "#f5f5f3"
  paper-raised: "#fbfbfa"
  film: "#111111"
  film-raised: "#1c1c1b"
  film-line: "#3a3a38"
  ink: "#1a1a19"
  mute: "#5b5b57"
  rule: "#d8d8d4"
  key-line: "#b9b9b4"
  edge-print: "#bcbcb7"
  grease: "#e0401c"
  amber: "#d9a441"
typography:
  display:
    fontFamily: "Archivo, Archivo Fallback, Arial, sans-serif"
    fontSize: "46px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  body-lede:
    fontFamily: "Archivo, Archivo Fallback, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Archivo, Archivo Fallback, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  body-small:
    fontFamily: "Archivo, Archivo Fallback, Arial, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.38
  label-button:
    fontFamily: "Archivo, Archivo Fallback, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1
  edge-title:
    fontFamily: "Barlow Condensed, Barlow Condensed Fallback, Arial Narrow, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.15
    fontFeature: "tnum"
  edge-print:
    fontFamily: "Barlow Condensed, Barlow Condensed Fallback, Arial Narrow, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  hand:
    fontFamily: "Caveat, cursive"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
rounded:
  tag: "2px"
  chrome: "3px"
  button: "4px"
spacing:
  gutter: "24px"
  gutter-phone: "16px"
  frame-gap: "12px"
  head-gap: "56px"
components:
  button-primary:
    backgroundColor: "{colors.film}"
    textColor: "{colors.paper}"
    typography: "{typography.label-button}"
    rounded: "{rounded.button}"
    padding: "14px 26px"
  button-primary-hover:
    backgroundColor: "#000000"
  button-dock:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.chrome}"
    padding: "7px 13px"
    height: "36px"
  button-dock-hover:
    backgroundColor: "{colors.film-raised}"
  tag-flashing:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.film}"
    rounded: "{rounded.tag}"
    padding: "1px 6px 2px"
  tag-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.mute}"
    rounded: "{rounded.tag}"
    padding: "0 5px 1px"
  keycap:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chrome}"
    padding: "1px 5px"
  film-frame:
    backgroundColor: "{colors.film}"
    textColor: "{colors.edge-print}"
    padding: "24px 10px 38px"
  plate-chip:
    backgroundColor: "{colors.film}"
    textColor: "{colors.paper}"
    rounded: "{rounded.chrome}"
    padding: "11px 14px 12px"
  dock:
    backgroundColor: "{colors.film}"
    textColor: "{colors.paper}"
    rounded: "{rounded.chrome}"
    padding: "18px 10px"
---

# Design System: Dead pixel tester

## Overview

**Creative North Star: "The Contact Sheet"**

The interface is a photographer's contact sheet: hue-free photographic paper carrying strips of black film, each frame a colour-exact render of a real test plate, edge-printed with its frame number, marked by hand in grease pencil. The visitor sees the whole test before running it. Once the test starts, one plate owns the whole screen and the only chrome left is a small strip of film (the label chip and the control dock) that hides itself.

Density is moderate and documentary: every frame sits at one scale and one registration, every hint sits directly under its own frame, and the copy is plain sans in plain sentences. Character comes from the material vocabulary (film, sprockets, edge print, grease pencil), never from colour washes or decoration. Colour is reserved for meaning: the plates' own colours inside the frames, two hand marks in grease-pencil red, and amber for flashing.

The plates themselves are test equipment, not design: their colours and geometry are exact and sit outside this system.

**Key Characteristics:**
- Neutral, hue-free paper ground with film-black strips and chrome.
- Sprocket holes, edge-printed frame numbers in a condensed face, and a drawn triangle frame marker.
- Grease-pencil red as the hand: frame marks, focus ring, link hover.
- Amber has exactly one meaning: flashing.
- Thumbnails rendered by the same renderer as the test, at one scale and registration.
- In test, chrome is film-black, small, and gets out of the way.

## Colors

A neutral paper-and-film palette with two marks of meaning: grease-pencil red for the hand, amber for flashing.

### Primary
- **Film Black** (film): the film strips behind every frame, the Start test button, the in-test chip and dock, text selection, the scrollbar thumb, and the checkbox accent. It is the world's structural colour.

### Secondary
- **Grease-Pencil Red** (grease): the hand. Draws the box around frame 1, the ring around the flashing frame, the strike through it when it is left out, and the handwritten "start" note. Also the global focus outline (2px, 3px offset) and the link underline on hover.

### Tertiary
- **Flashing Amber** (amber): one meaning only, "flashing". It appears in exactly two places: the fill of the frame-6 tag ("Flashes every 0.7 s") on the contact sheet, and the 6px round dot on the in-test Skip flashing button. Nothing else is amber.

### Neutral
- **Photographic Paper** (paper): the page ground, hue-free, never cream. Also the sprocket holes on intro strips and text on film.
- **Raised Paper** (paper-raised): keycap faces in the controls summary.
- **Raised Film** (film-raised): hover fill for dock buttons.
- **Film Line** (film-line): 1px outline of dock buttons at rest.
- **Ink** (ink): primary text on paper, plate names under frames, keycap text.
- **Mute** (mute): secondary copy (hints, controls summary, footer, plate count, quiet tag).
- **Rule** (rule): the hairline above the controls summary and the scrollbar track.
- **Key Line** (key-line): keycap and quiet-tag outlines.
- **Edge Print** (edge-print): frame numbers printed on film, the dock's plate counter, the chip's frame number.

### Named Rules
**The One Meaning Amber Rule.** Amber means "flashing" and nothing else. It is the frame-6 tag fill and the 6px dot on the in-test Skip flashing button. When flashing is off or reduced motion makes the plate a still split, the tag drops to the quiet outlined variant and the amber goes away.

**The Grease Is the Hand Rule.** Grease-pencil red is drawn, not filled: strokes, rings, boxes, the one handwritten word, the focus ring. It never fills a surface or a button.

**The Hue-Free Paper Rule.** Paper and its neutrals carry no warmth or tint. Colour on the sheet comes only from the plates and the two marks.

## Typography

**Display Font:** Archivo (with a metric-matched Arial fallback)
**Body Font:** Archivo
**Label/Mono Font:** Barlow Condensed 500/600 for edge print (with a metric-matched Arial Narrow fallback)
**Hand Font:** Caveat 600, subset to the letters of "start"

**Character:** A plain, sturdy grotesque for every sentence, against a condensed face that behaves like the numbers printed on film stock. The handwriting appears once.

### Hierarchy
- **Display** (700, 46px, line-height 1, -0.02em; 36px on phones): the page title only.
- **Lede** (400, 17px, 1.45; 16px on phones, max 31em): the one-line explanation under the title.
- **Body** (400, 15px, 1.45): base copy; the flash setting label sits at 600, 15px.
- **Small** (400, 12.5-13.5px, 1.38-1.45): frame hints, the flash warning, the controls summary (13px).
- **Button label** (600, 16px, line-height 1): Start test. Dock buttons are 500, 14px.
- **Edge title** (Barlow Condensed 600, 16px, 1.15): plate names under frames; 19px in the in-test chip.
- **Edge print** (Barlow Condensed 600, 13px, tabular figures): frame numbers on film; the dock counter at 16px; plate count and footer at 500, 15-17px.
- **Hand** (Caveat 600, 28px): the single word "start" beside frame 1, only at 1300px and wider.

### Named Rules
**The Edge Print Rule.** Numbers that count frames or plates, and plate names, use the condensed edge face with tabular figures. Sentences never do.

**The One Word Rule.** The hand face is subset to "start" and writes nothing else. Any other handwritten word would fall back to a system cursive.

## Layout

The intro is a single column capped at 1080px with a 24px gutter (16px under 640px), filling at least the dynamic viewport height so the footer sits at the bottom. The head is a two-column grid (text, then a fixed 400px action column, 56px gap): title and lede top left, Start test with plate count and the flash setting top right. Below it, two film strips of six columns each (frames 1-6, 7-11), 12px between strips, each hint directly under its frame. A 1px rule and a three-column controls summary close the sheet, then the footer.

At 980px and below the head stacks and strips become three-column frame grids; at 640px and below they become two-column grids (12px column gap, 16px row gap) and the film padding tightens (20px 8px 32px). Start test stays above the fold on phones.

The in-test stage is a fixed full-viewport plate. The chip sits top left at 18px (safe-area aware), the dock bottom centre at 16px. Under 420px the dock wraps and Previous/Next collapse to drawn chevrons; under 360px the counter is dropped.

**The One Registration Rule.** Every frame on the sheet is 16:10 at the same scale, inside the same film padding, on every breakpoint. Strips and phone grids are the same markup.

**The Plate Owns the Screen Rule.** In test, nothing sits on the plate except the chip and dock, and both hide after 3 seconds, returning only on deliberate movement or an edge tap.

## Elevation & Depth

The paper is flat. Depth appears only where an object physically sits on something: the Start button lifts slightly off the paper, and the in-test chip and dock float above the plate on soft, diffuse dark shadows. Film strips on the sheet carry no shadow; they lie flat on the paper.

### Shadow Vocabulary
- **Button rest** (`box-shadow: 0 1px 2px rgba(17,17,17,0.18), 0 4px 10px -4px rgba(17,17,17,0.3)`): Start test at rest.
- **Button hover** (`box-shadow: 0 1px 2px rgba(17,17,17,0.2), 0 8px 18px -6px rgba(17,17,17,0.38)`): Start test on hover; drops to `0 1px 1px rgba(17,17,17,0.2)` when pressed.
- **Chip** (`box-shadow: 0 2px 10px -2px rgba(0,0,0,0.45)`): the in-test plate label.
- **Dock** (`box-shadow: 0 4px 18px -4px rgba(0,0,0,0.5)`): the in-test control bar.

### Named Rules
**The Flat Sheet Rule.** Nothing on the contact sheet casts a shadow except the one primary button. Shadows are soft and diffuse; never hard offset.

## Shapes

Corners are nearly square: 2px on tags, 3px on chrome (chip, dock, dock buttons, keycaps), 4px on the Start button. Film strips and frames are square-cornered. Sprocket holes are small rounded rectangles (10x7 at 1.5px radius on the sheet, 8x5 at 1px on the dock, in a darker #333331 so they never read as lit pixels). The frame marker is a drawn triangle, not a glyph. Grease marks are hand-drawn SVG paths with round caps and joins at a 3px non-scaling stroke, rotated about one degree off true.

## Components

### Buttons
Film-black and sure-footed on the sheet; quiet outlines on the dock.
- **Shape:** nearly square (4px primary, 3px dock).
- **Primary (Start test):** film fill, paper text, 600 16px, 14px 26px padding (15px 28px on phones), with the button rest shadow.
- **Hover / Focus:** hover deepens to pure black and lifts the shadow (160ms, cubic-bezier(0.16, 1, 0.3, 1)); focus is the global grease-red outline.
- **Dock buttons:** transparent with a 1px film-line outline, paper text at 500 14px, 36px minimum height; hover raises the fill to raised film and lightens the outline (140ms).
- **Skip flashing:** a dock button carrying the 6px amber dot before its label, shown only while the flashing plate is on screen and reduced motion is off.

### Chips (tags)
- **Flashing tag:** amber fill, film text, 600 12px, 2px corners, under the flashing frame's hint.
- **Quiet tag:** transparent with a 1px key-line outline and mute text, used when the flashing plate is left out or shown as a still split.

### Keycaps
- **Style:** raised paper face, 1px key-line outline thickened to 2px at the bottom, 3px corners, ink text at 600 12px, minimum 1.6em wide. Used inline in the controls summary.

### Inputs / Fields
- **Checkbox:** native, 18px, accent-coloured film; its label is 600 15px beside it with a 10px gap. The warning beneath turns from mute to ink, led by a bold "Warning:", when the flashing plate is included.

### Film Frame (signature)
A cell of film: film-black ground with a sprocket row top and bottom (inset 4px, 8px from the edge), a 16:10 frame holding the real plate render, and the frame number edge-printed bottom left with the triangle marker. The hint sits on paper beneath: plate name in the edge title, one sentence in small mute copy. A left-out frame dims to 30% and takes a grease strike.

### Grease Marks (signature)
Hand marks in grease red: a box on frame 1 (the start frame), a ring on the flashing frame, a strike through it when left out, and the handwritten "start" with an arrow at wide desk widths. There are only two meanings for a mark: where to start, and what flashes.

### In-test Chip and Dock
Small strips of film over the plate. The chip shows the edge-printed frame number and plate name (19px edge title) with the hint in #d4d4cf at 14px. The dock holds Previous, the counter, Next, Skip flashing, Full screen and Stop, edged by dark sprocket rows. Both fade in and out (180ms opacity; the dock also rises 12px over 220ms) and stop transitioning under reduced motion.

## Do's and Don'ts

### Do:
- **Do** render every thumbnail through the same renderer as the test, at one 16:10 scale and registration.
- **Do** keep amber to its one meaning: the frame-6 flashing tag fill and the 6px dot on Skip flashing.
- **Do** draw grease-pencil marks as stroked, slightly rotated SVG paths at a 3px non-scaling stroke.
- **Do** set frame numbers, counters and plate names in Barlow Condensed with tabular figures.
- **Do** dress any in-test chrome in film black with edge print, and let it hide.
- **Do** use the grease-red outline (2px, 3px offset; 2px offset on dock buttons) for every focus state.

### Don't:
- **Don't** tint the paper warm or cream; it stays hue-free (paper).
- **Don't** use amber or grease red as a surface fill, button fill or decoration.
- **Don't** put coloured left borders on anything.
- **Don't** place chrome over the plate beyond the chip and dock, and never keep them pinned while the visitor checks pixels.
- **Don't** use the hand face for any word but "start".
- **Don't** use hard offset shadows; shadows are soft and only on the primary button and in-test chrome.
- **Don't** treat plate colours as palette; they are test equipment and stay exact.

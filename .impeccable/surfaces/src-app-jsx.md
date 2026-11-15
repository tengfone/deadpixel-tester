---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

# Surface: Dead pixel tester intro screen and in-test chrome

Mode: Operate. Audience: new-monitor buyers, second-hand buyers (often on a phone), people diagnosing a speck. The plates themselves are test equipment and are out of scope: colours and geometry stay exact. Owner delegated the direction choice; chosen: Contact Sheet (the roll).

## Direction contract

THESIS: The intro is a contact sheet of the real eleven plates, so the visitor sees the whole test before running it. It refuses the category default of a centred title, one paragraph and a big Start button.

OWN-WORLD: Neutral photographic-paper ground #f5f5f3 (hue-free, not cream), film-black strips #111111 with sprocket holes, edge-printed frame numbers in a condensed face, grease-pencil red #e0401c for the two hand marks (start frame, flashing warning), amber #d9a441 only as the flashing-plate tag fill. Plain sans for copy. Thumbnails are colour-exact CSS renders of each plate, all at one scale and registration. No coloured left borders.

STORY: The visitor reads what dead and stuck pixels look like, scans the eleven frames with one hint under each, decides about the flashing plate, presses Start test, and steps through full-screen plates with the chrome out of the way.

FIRST VIEWPORT: Title and one-line explanation top left; Start test, plate count and the Include flashing plate checkbox with warning top right. Two film strips (frames 1-6, 7-11) span the width, hints directly under each frame, grease-pencil box on frame 1 and ring on frame 6. Controls summary along the bottom, source link in the footer. Phone: strips become a two-column frame grid, Start test stays above the fold.

FORM: Contact Sheet, position 6 on my ordered list (the roll). seed:fef459d822d704e7. Raises kept: one exact scale and registration for every frame; each hint beside its frame; during the test one plate owns the whole screen. In-test control bar and label take the film-black and edge-print vocabulary.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

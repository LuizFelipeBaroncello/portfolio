# Product

## Register

brand

## Users

Curious general visitors who land on a personal portfolio without a specific job to do. They might be a designer, a developer, a recruiter, a friend, or someone who followed a link. They are not here to accomplish a task; they are here to look around. The interactive tools (`/sun-map`, `/amortizacao`, `/ev-stats`) are the substance they explore, and each one should reward poking at it.

## Product Purpose

A personal portfolio for Luiz Felipe Baroncello, structured as a small collection of working tools rather than a résumé. The landing is a bento grid of cards, and each interactive page is itself a piece of evidence: the sun-position simulator, the loan amortization tool, the EV stats explorer. Success looks like a visitor playing with one of the tools, finding something surprising, and wanting to share it.

## Brand Personality

Precise, warm, playful. The voice is that of someone who builds carefully measured things and is genuinely delighted that you stopped by. Confidence without volume: the work argues for itself. Three words, not interchangeable; lose any of them and the personality shifts (cold, sloppy, or earnest-to-a-fault).

## Anti-references

- **Generic dev-portfolio template.** The dark-hero, "Hi I'm X", timeline-of-jobs, monochrome-icons archetype. Refused on principle.
- **Maximal art-school portfolio.** Mouse trails, custom cursors, scroll hijacking, kitchen-sink WebGL effects. Loudness for its own sake.
- **Corporate SaaS dashboard chrome.** Sidebar + topbar + cards-of-metrics. Floating dark glass panels stacked on top of each other.
- **Aesthetic descendants of the above.** Including the second-order trap: "personal site that isn't a dev template, so it's an editorial monospace site" is also the reflex. Aim for something that doesn't fit cleanly into a known lane.

## Design Principles

1. **Tools are the proof, chrome is the frame.** On any interactive page the canvas (map, chart, model) owns the surface. Overlays earn their pixels by being indispensable, not decorative.
2. **Precision delivered warmly.** Numbers and measurements stay exact. The surrounding typography, motion, and copy feel made by a person, not a template.
3. **Playful without volume.** Personality lives in micro-interactions, copy choices, and small surprises. Never in cursor trails, scroll hijacks, or gratuitous effect layers.
4. **Asymmetry over symmetry.** Centered-everything is a tell of the generic portfolio. Compose with intentional weight on one side; let space do the hierarchy work.
5. **One canvas, few panels.** On tool pages, resist the urge to scatter floating panels. Consolidate, dock, or hide.

## Accessibility & Inclusion

WCAG 2.1 AA baseline across all pages. Specifically: keyboard navigation through all interactive controls; visible focus states; AA contrast on all text and meaningful UI; respect `prefers-reduced-motion` for any animation longer than a state transition; touch targets at least 44px on mobile. The interactive tools must remain operable when sliders and drag are the only inputs, but core functions should have keyboard-reachable equivalents.

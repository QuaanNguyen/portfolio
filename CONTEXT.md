# Domain Glossary

This document defines canonical domain terms for the Quan Nguyen portfolio codebase.

## Core Concepts

### PortfolioPage
The primary single-page presentation of Quan Nguyen's background, professional experiences, education, open-source contributions, and interactive identity. Presented as a full-viewport responsive desktop split layout and stacked mobile experience.

### LogoSignature
The animated blue monogram mark and its accompanying six-note acoustic guitar chord chime (G-minor voicing). Plays during initial page reveal and serves as an interactive audio-visual brand element.

### IdentityRail
The interactive hover showcase cycling through Quan's identity roles (engineer, overlander, chomper, foodie) with coordinated visual preview motion and responsive positioning.

### Playground
The creative-project catalog reached from the portfolio's "enter site" button, living in `src/playground/`. Gated by the `VITE_PLAYGROUND_MAINTENANCE` flag (on unless set to `off`).

### ComingSoon
The Playground's maintenance face: the "// coming soon" label with sad emoji collision bodies dropping under gravity. Shown in the portfolio section while maintenance is on; `/playground` redirects home.

### Sandbox
The Playground's live face at `/playground`: a sand heightfield the visitor plows with project cards or a finger, with `ctrl+z` undo and 3D objects rising out of hovered cards.

### ChordStudio
An exploratory sound design environment for interactive multi-fret chord voicing and harmonic analysis, isolated from the production portfolio runtime.

### LegacyArchive
The preserved collection of previous portfolio source code, guestbook components, and historical champion assets retained in `src/orphaned/legacy-portfolio/` for archival reference without inclusion in active production bundles.

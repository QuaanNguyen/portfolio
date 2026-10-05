# ADR 0001: Graduate Live Portfolio from Prototype to Canonical Core

## Status
Accepted

## Context
The redesigned portfolio was initially created under `src/prototypes/portfolio-revamp/`. To release it quickly, `App.jsx` pointed `<Route path="/">` directly into the prototype directory while the previous portfolio was moved to `src/orphaned/legacy-portfolio/`.

This created architectural friction:
1. Production code lived inside a directory named `prototypes/`, intermixed with dead prototype variants (`PrototypeSwitcher.jsx`) and exploratory tools (`ChordStudio.jsx`).
2. CSS was split across two overlapping stylesheets (`portfolio-revamp.css` with 2,900+ lines and `portfolio-home.css` with 780+ lines) where one overrode the other.
3. The production 6-note logo chime was tightly coupled to an 800-line acoustic guitar synthesizer engine (`useGuitarEngine.js`), forcing Vite build configuration to run a post-bundle deletion hook to purge physical guitar audio samples from release artifacts.
4. Test commands in `package.json` were titled `test:prototype` and hardcoded prototype paths.

## Decision
1. **Promote Production Core**: Move all components, assets, physics, and styles that power the live site from `src/prototypes/portfolio-revamp/` into `src/portfolio/`.
2. **Collapse Shallow Entrypoint**: Merge `PortfolioHomePage.jsx` and `HomeVariants.jsx` into a single canonical deep component `PortfolioPage.jsx` with unified stylesheet `portfolio.css`.
3. **Establish Clean Audio Seam**: Extract `useLogoAudio` strictly responsible for priming and playing the 6-note G-minor mark. Relocate the physical guitar chord voicing engine exclusively to `src/prototypes/chord-studio/`, eliminating the custom Vite post-build artifact deletion hook.
4. **Isolate Exploratory Prototypes**: Keep `ChordStudio` and its harmonic canvases in `src/prototypes/chord-studio/`, exposed under a dev-only route (`/prototype/chord-studio`).
5. **Standardize Test Tooling**: Expose `npm test` targeting canonical unit test files across the repository.

## Consequences
- **Positive**: High locality and depth. Production code is clearly distinguished from experimental sandboxes. CSS overrides and bundle overhead are eliminated.
- **Positive**: Build configuration in `vite.config.js` is cleaned of ad-hoc filesystem deletion logic.
- **Trade-off**: Internal file paths within `src/` are reorganized, requiring updating import paths and test file locations.

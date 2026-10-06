# Spec: Playground Sandbox Catalog & Interactive 3D Showcase

## Problem Statement

When visitors explore the portfolio, the current Playground section is an under-construction dead-end displaying a temporary physics easter egg with falling sad emojis rather than showcasing interactive engineering work. Visitors cannot explore the author's creative technology projects—such as ChordStudio, League Impostor, and the Guestbook—within a cohesive, engaging catalog that reflects the author's visual taste, creative coding skills, and interaction design capabilities. Furthermore, direct redirects to isolated prototype routes break spatial immersion and fail to provide visitors with a unified creative laboratory experience.

## Solution

Transform the Playground into a dedicated, top-down interactive sandbox catalog accessible at `/playground`. On desktop devices, visitors encounter a tactile, dithered sand pit populated with organic sand dunes and draggable project cards styled to match the portfolio's minimalist design system. As cards are dragged through the pit, the sand reacts with heightmap-driven flow displacement, creating the physical illusion of displacement without expensive per-particle physics. 

Hovering over each project card summons a tailored, localized 3D interactive object rendered in Three.js:
- An interactive acoustic guitar for ChordStudio that plays pre-determined G-minor chord tones as the cursor sweeps across its strings, leveraging existing acoustic audio samples.
- A mysterious, shadowed champion silhouette with a question mark on its torso for League Impostor that tilts dynamically in 3D parallax with cursor coordinates.
- Playful floating speech bubbles for the Guestbook that exhibit magnetic spring repulsion, bouncing away as the cursor approaches and settling back into place.

On mobile devices, the catalog gracefully degrades to an accessible, high-performance vertical card stack free of heavy canvas physics and 3D overlays. The entire experience connects seamlessly with the primary portfolio page via instant navigation anchored by the brand LogoSignature.

## User Stories

1. As a desktop portfolio visitor, I want to click the Playground "enter site" button, so that I am instantly navigated to the full-screen interactive sandbox catalog at `/playground`.
2. As a mobile portfolio visitor, I want to tap the Playground "enter site" button, so that I can browse a responsive, high-performance project list without running intensive desktop-only graphics.
3. As a developer testing in progress, I want the under-construction emoji-drop behavior to remain controllable via a feature flag, so that I can test the catalog in isolation before flipping the public experience live.
4. As a desktop visitor arriving at `/playground`, I want to see a top-down sand pit rendered in warm, tactile dithered tones, so that the page feels like an organic, playful physical sandbox.
5. As a desktop visitor, I want to see random sand dunes and mounds on the initial canvas surface, so that the environment has immediate visual depth and tactile texture.
6. As a desktop visitor, I want to see project cards resting as white tiles in the sand pit, so that they contrast cleanly with the warm sand and remain immediately legible.
7. As a desktop visitor, I want project cards to display only the project title and a single-line descriptive tagline, so that the catalog maintains the crisp editorial minimalism of the main portfolio.
8. As a desktop visitor, I want to click and drag any project card across the sandbox, so that I can playfully interact with the cards as physical objects.
9. As a desktop visitor dragging a card, I want the sand surface to displace and flow away along the card's direction of motion, so that I experience the convincing illusion of dragging a physical block through real sand.
10. As a desktop visitor, I want the sand surface to gradually settle after being disturbed, so that repeated interactions leave natural, evolving dune topology.
11. As a desktop visitor, I want to click the LogoSignature in the top corner of the playground, so that I can instantly return to the root portfolio page.
12. As a desktop visitor hovering over the ChordStudio card, I want a 3D acoustic guitar model to emerge at the card's position, so that I immediately understand the project is an interactive musical instrument.
13. As a desktop visitor hovering over the 3D guitar, I want individual strings to sound their corresponding G-minor chord tones when my cursor brushes past them, so that I can playfully strum the instrument before opening the project.
14. As a desktop visitor hovering over the League Impostor card, I want a blacked-out champion silhouette bearing a central question mark to appear, so that the visual theme of deception and hidden identity is conveyed.
15. As a desktop visitor hovering over the League Impostor 3D card, I want the model to tilt dynamically in response to my cursor's coordinates relative to the card center, so that the card feels reactive and three-dimensional.
16. As a desktop visitor hovering over the Guestbook card, I want floating comment speech bubbles to appear around the card, so that the community-driven nature of the project is visually highlighted.
17. As a desktop visitor hovering near the 3D comment bubbles, I want the bubbles to repel away from my cursor and spring back when the cursor retreats, so that the interaction feels buoyant, tactile, and responsive.
18. As a desktop visitor moving my cursor away from an active project card beyond a defined distance threshold, I want the active 3D object to dismiss cleanly, so that the sandbox view remains uncluttered.
19. As a desktop visitor moving my cursor directly from one project card to another, I want the previous 3D object to dismiss and the new project's 3D object to appear seamlessly, so that cards do not trigger overlapping 3D clutter.
20. As a visitor clicking on the ChordStudio card, I want to navigate to the full interactive guitar studio experience at `/playground/chord-studio`.
21. As a visitor clicking on the League Impostor card, I want to navigate to the League Impostor party game at `/playground/league-impostor`.
22. As a visitor clicking on the Guestbook card, I want to navigate to the interactive comment board at `/playground/guestbook`.
23. As a visitor inside any individual project sub-page, I want clicking the LogoSignature to return me directly back to the playground catalog or home portfolio.
24. As a visitor with reduced motion preferences enabled, I want decorative 3D animations and sand particle flow to be subdued or disabled, so that the page respects my system accessibility preferences.
25. As a mobile visitor on a smartphone or tablet screen (<1024px), I want to see a clean, accessible vertical card stack with crisp typography and clear touch targets, so that I can navigate projects comfortably with one hand.
26. As a visitor on a slow network connection, I want Three.js and core runtime assets to load smoothly during the initial page entrance sequence, so that navigating into the Playground does not trigger secondary loading spinners.

## Implementation Decisions

### Architectural Structure & Routing
- The project will introduce a dedicated top-level route `/playground` managed by the application router, alongside project sub-routes `/playground/chord-studio`, `/playground/league-impostor`, and `/playground/guestbook`.
- Navigation between the primary `PortfolioPage` and `/playground` will be an instant cut without heavy page-transition choreography, ensuring immediate focus on the sandbox initialization.
- The existing under-construction emoji physics component will be decoupled into a feature-flagged module, allowing the portfolio entry button to toggle between the placeholder easter egg and direct catalog entry.
- Sub-pages for League Impostor and Guestbook will be graduated from the `LegacyArchive` into modernized wrapper components that adopt the project's canonical typography and styling tokens while leaving archival source intact.

### Sand Pit Surface & Heightmap Displacement
- The sand pit will be implemented as an interactive 2D canvas running a custom heightmap displacement simulation paired with an ordered Bayer dithering shader/post-process pass.
- Color palette tokens will specify warm sand values (light sand base `#f5e6c8`, mid-tone dunes `#d4b896`, shadow depths `#b8956a`, and golden highlights `#ffe4a3`), providing deliberate contrast against the monochrome primary portfolio.
- The heightmap state will maintain a scalar grid representing surface elevation. Initialization will seed smooth Perlin/simplex dunes across the canvas.
- When project cards are dragged, the card's bounding box and velocity vector will inject positive displacement along the forward edge and depression in the wake, spreading outward via a 2D diffusion kernel and decaying over time back toward equilibrium.
- Rendering will sample heightmap normals and map local luminance into an ordered dither matrix to generate crisp, grain-like sand texture at high frame rates without allocating per-particle physics bodies.

### Card Drag & Physics Seam
- Cards will be rendered as lightweight DOM elements layered above the sand canvas, maintaining high accessibility, text sharpness, and standard DOM event bubbling.
- Dragging will be handled via standard Pointer Events (`onPointerDown`, `onPointerMove`, `onPointerUp`) with pointer capture, calculating delta offsets and broadcasting movement vectors directly to the underlying sand heightmap engine.
- Cards will maintain boundary clamping to ensure they remain contained within the sandbox viewport across browser resize events.
- Card styling will strictly follow the canonical portfolio design system: background `#ffffff`, border `1px solid #e8e8e8`, border radius `2px`, typography in `Hedvig Letters Sans` with `-0.025em` to `-0.035em` letter-spacing, and subtle elevation shadow (`0 8px 24px rgba(0, 0, 0, 0.06)`).

### Three.js Hover Overlay & 3D Interaction Engine
- A single transparent Three.js WebGL canvas will overlay the sandbox space, managed via `@react-three/fiber` and `@react-three/drei`.
- To avoid secondary bundle delays during catalog navigation, Three.js core dependencies will be included in the primary application bundle and initialized during the initial `PortfolioLoader` sequence.
- 3D models will be decoupled through a pluggable asset interface, allowing procedural fallback shapes initially and drop-in glTF models later without modifying interaction logic:
  - **ChordStudio**: An acoustic guitar model oriented near the card. Raycasting against invisible string trigger planes will detect cursor intersections. When an intersection occurs, the corresponding string note will trigger playback using the existing `useLogoAudio`/guitar audio infrastructure mapped to pre-determined G-minor chord intervals.
  - **League Impostor**: A stylized character silhouette with a neutral dark material and an overlaid question mark texture. Cursor coordinates normalized to the card center will drive target rotation angles with spring dampening, creating a responsive 3D card tilt.
  - **Guestbook**: Procedural 3D rounded speech bubble meshes with dynamic text badges. The bubbles will maintain resting anchor positions; as the cursor enters a proximity radius, a radial repulsion force vector will push the bubble outward with linear spring restitution returning it to rest.
- Hover state management will follow a proximity hysteresis model: entering a card triggers the 3D entity, while moving beyond a defined bounding threshold or entering another card dismisses it immediately.

### Mobile Responsive Degradation
- Viewports under `1024px` will switch via CSS media queries and conditional rendering to a vertical list of static project cards.
- On mobile, the 2D sand canvas simulation and Three.js WebGL context will not mount, saving battery, memory, and GPU cycles. Cards will function as direct navigational tap targets.

## Testing Decisions

### What Makes a Good Test
Tests in this codebase must strictly verify external observable behavior rather than private implementation details. A good test asserts that users can navigate routes, drag cards within bounds, displace sand topology within expected mathematical invariants, and trigger appropriate audio-visual signals without crashing or exceeding layout constraints. Tests must never inspect internal component state variables or private shader uniforms.

### Modules Under Test
1. **Sand Heightmap Engine (`src/playground/sandDisplacement.test.js`)**:
   - Unit tests running in Node (`node:test`) asserting that velocity injections modify grid elevations, boundary clamping prevents coordinate overflow, diffusion dissipates energy over successive ticks, and resting equilibrium is reached.
2. **Card Bounds & Drag Constraints (`src/playground/cardMotion.test.js`)**:
   - Unit tests verifying coordinate clamping, card collision avoidance, and correct velocity calculation under simulated pointer sequences.
3. **Guitar String Audio Mapping (`src/playground/guitarStringAudio.test.js`)**:
   - Unit tests verifying that 6 discrete string trigger zones correctly map to the expected G-minor chord pitch frequencies and invoke the audio trigger callback.
4. **End-to-End Layout & Navigation (`tests/portfolio-layout.e2e.test.js`)**:
   - Playwright end-to-end tests verifying:
     - Navigation from root portfolio to `/playground` via the "enter site" button.
     - Successful rendering of project cards and the sand container on desktop viewports (1440x900).
     - Responsive fallback to the vertical card list on mobile viewports (390x844).
     - Return navigation to root portfolio via LogoSignature click.

### Prior Art
- `src/portfolio/playgroundPhysics.test.js`: Demonstrates clean mathematical testing of physics bounds, body addition, and step iterations using `node:test` and `node:assert/strict`.
- `tests/portfolio-layout.e2e.test.js`: Demonstrates Playwright browser automation validating viewport layout bounds, identity rails, and accessible button interactions under headless Chrome.

## Out of Scope
- Realistic per-particle granular sand physics (thousands of discrete rigid bodies or grain collisions).
- Authoring custom final 3D glTF model assets (pluggable interfaces and procedural placeholders will be used initially; final glTF models will be authored and dropped in by the author later).
- In-place inline expansion of the portfolio page for the playground (route-based navigation is chosen).
- Touch-driven 3D interaction and canvas drag simulation on mobile devices.
- Multi-user real-time sand synchronization or multi-user cursors in the sandbox.

## Further Notes
- The dither algorithm will offer a developer sampler during implementation (Bayer 4x4, Bayer 8x8, Floyd-Steinberg, Atkinson) to allow visual calibration against the warm palette tokens.
- Audio playback on string sweep will honor user gesture requirements; audio contexts will remain unmuted following the initial user entrance click.

---
description: Comprehensive guidelines for implementing frontend features, modifying UI logic, and updating visuals using the project's specific tech stack.
globs: src/**/*
alwaysApply: false
---

# Frontend Feature & UI Specialist Guide

## 1. Role & Objectives
You are a Senior Frontend Engineer responsible for implementing user-facing features and refining UI/UX. Your code must be performant, accessible, and strictly adhere to the project's tech stack.

## 2. Tech Stack Constraints (Strict)
* **Framework:** React v19+ (Functional Components & Hooks only)
* **Styling:** Tailwind CSS v4+ (via `@tailwindcss/vite`)
* **Icons:** Heroicons (`@heroicons/react`)
* **Routing:** React Router v7+

## 3. Implementation Guidelines

### A. State Management & Logic
* **Hooks:** Use standard hooks (`useState`, `useRef`) for local UI state (e.g., toggling visibility, form inputs).
* **Logic Updates:** When modifying logic (e.g., changing "blur on load" to "visible on load"), locate the state initialization first.
    * *Bad:* Overriding state with effects.
    * *Good:* Changing the default value in `useState` or the conditional rendering logic in JSX.
* **Custom Hooks:** Extract complex logic into `src/hooks` (e.g., `useClickOutside`, `useRealtimeSubscription`).

### B. Visuals & Styling (Tailwind v4)
* **Utility First:** Apply styles directly via `className`. Avoid inline `style={{...}}` unless dynamic coordinates are required.
* **Layout:** Use Flexbox (`flex`, `items-center`) and Grid (`grid`) for structure.
* **Interactivity:** Always define state modifiers for interactive elements:
    * `hover:...`
    * `active:...`
    * `focus-visible:...`

### C. Iconography
* Always use **Heroicons** for UI elements (buttons, indicators).
* Import pattern: `import { IconName } from '@heroicons/react/24/outline'` (or `/solid`).
* Sizing: Use Tailwind `size-*` utility (e.g., `size-5` or `w-5 h-5`) to control icon dimensions.

## 4. Workflow: Adding/Modifying Features

### Step 1: Component Identification
Identify if the feature belongs in an existing component or requires a new file in `src/components`.

### Step 2: Visual Structure (JSX + Tailwind)
Draft the static version first using Tailwind classes.

### Step 3: Logic Integration
Connect event handlers (`onClick`, `onChange`) to state.
* *Example:* `onClick={() => setIsModalOpen(true)}`

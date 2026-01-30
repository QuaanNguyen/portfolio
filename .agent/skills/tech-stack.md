---
description: Comprehensive guide to the portfolio project's tech stack, development commands, and architecture.
globs: **/*
alwaysApply: true
---

# Project Context & Tech Stack Guide

## 1. Project Overview
* **Name:** `portfolio`
* **Type:** SPA (Single Page Application) / Module
* **Deployment:** Vercel (configured with rewrite rules for SPA)

## 2. Tech Stack & Key Dependencies
* **Core Framework:** React v19+
* **Build Tool:** Vite v6+
* **Routing:** React Router v7+ (`react-router-dom`)
* **Styling:** Tailwind CSS v4+ (utilizing `@tailwindcss/vite`)
* **Backend / DB:** Supabase (`@supabase/supabase-js`)
* **Icons:** Heroicons (`@heroicons/react`)
* **Linting:** ESLint v9+

## 3. Development Commands
Use `npm` for package management.

* **Install Dependencies:**
    ```bash
    npm install
    ```
* **Start Development Server:**
    ```bash
    npm run dev
    # Runs: vite
    ```
* **Build for Production:**
    ```bash
    npm run build
    # Runs: vite build
    ```
* **Preview Production Build:**
    ```bash
    npm run preview
    # Runs: vite preview
    ```
* **Lint Code:**
    ```bash
    npm run lint
    # Runs: eslint .
    ```

## 4. Environment Variables
The project uses `import.meta.env` for environment variables. Ensure the following are set in `.env`:

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_KEY`
* `VITE_BASE_PATH` (Optional, defaults to `/`)

## 5. Key Architecture Patterns
* **Client**: `src/lib/supabase.js` initializes the Supabase client.
* **Configuration**:
    * `vite.config.js` handles React and Tailwind plugins.
    * `vercel.json` handles rewrites (all routes -> `index.html`).
* **Folder Structure**:
    * `src/components`: Reusable UI components.
    * `src/hooks`: Custom hooks (e.g., `useDarkMode`).
    * `src/assets`: Static assets (images, PDFs).
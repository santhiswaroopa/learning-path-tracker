---
name: important-note
description: Use when modifying the star-toggle, glowing highlighted layout, or filters for important/revision notes.
---

# Important Note / Revision Skill

This skill explains how notes are marked important and integrated into the Quick Revision workflow.

## Reusable Workflow

1. **State Mutation**: Toggle the importance parameter on the database using PATCH `/api/notes/[id]` with payload `{ isImportant: !currentVal }`.
2. **Dashboard Synchronization**: Make sure the note is fetched and displays in the **Quick Revision** deck on the main dashboard.
3. **Card Styling**: Apply the glowing gradient background on `isImportant: true`:
   - Tailwind background: `linear-gradient(135deg, rgba(139,92,246,0.06) 0%, var(--card) 100%)`
   - Glowing border and shadow: `shadow-[0_0_20px_rgba(139,92,246,0.12)] border-violet-500/30`
4. **Telemetry Interaction**: Handle revision count telemetry via the localStorage key `lpt_revision_counts` (increments whenever the detail/revise modal is clicked).

## Design Conventions

- Always keep the gold star (`text-yellow-400` with drop shadow glow) as the active marker.
- Filter options: `All Important`, `Recently Added` (sorted by date), `Most Revised` (sorted by localStorage counts).

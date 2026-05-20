---
name: add-note
description: Use when adding a new note to a topic or configuring notes list pages and details drawer notes.
---

# Add Note Skill

This skill governs the standards for creating and rendering notes within topics and the main notes page.

## Reusable Workflow

1. **Verify Relationships**: Ensure the target `topicId` exists before persisting the note.
2. **Endpoint Actions**: Use `/api/notes` POST endpoint to create the note. Ensure standard validation prevents empty contents.
3. **Visual Highlight**: If the note is marked as `isImportant: true`, apply the violet gradient theme.
4. **Integration**: Update lists inside both `app/(dashboard)/notes/page.tsx` and the topic drawer inside `app/(dashboard)/topics/page.tsx`.
5. **Types Validation**: Make sure note properties align with `Note` interface inside `types/index.ts`.

## UI & Coding Conventions

- **Star Toggle**: Always include the star button overlay to let users toggle importance.
- **Optimistic State**: Use optimistic updates to toggles to keep UI interactions responsive.
- **Truncation**: Short excerpts should be derived using an `excerptTitle` utility to avoid layout breaking on long contents.

## Example JSON Payload

```json
{
  "topicId": 5,
  "content": "A Docker volume is mounted at a specific path, bypassing the Union File System.",
  "isImportant": true
}
```

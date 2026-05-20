---
name: update-progress
description: Use when updating subtopic completion state or recalculating topic progress metrics.
---

# Update Progress Skill

This skill documents the rules and formulas for calculating topic completion metrics when subtopics are updated.

## Reusable Workflow

1. **Toggle Action**: Invoke PATCH on `/api/subtopics/[id]` with the new `isCompleted` boolean state.
2. **Retrieve Metrics**: Load the list of all subtopics associated with the parent topic.
3. **Calculate Percentage**:
   ```typescript
   const completed = subtopics.filter(s => s.isCompleted).length;
   const progress = subtopics.length > 0 ? Math.round((completed / subtopics.length) * 100) : 0;
   ```
4. **Transition Status**:
   - `progress === 100` -> Set Topic Status to `COMPLETED`.
   - `progress > 0 && progress < 100` -> Set Topic Status to `IN_PROGRESS`.
   - `progress === 0` -> Set Topic Status to `NOT_STARTED`.
5. **Update Parent**: Save the new progress and status directly to the parent `Topic` record.
6. **Optimistic Updates**: Calculate and update local page state before completing database updates to ensure instantaneous UI response.

## Conventions

- Never decouple progress recalculation from subtopic completion updates.
- Keep calculations matching exactly in both database handlers (API routes) and UI state managers.

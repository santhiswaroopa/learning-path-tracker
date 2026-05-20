---
name: add-topic
description: Use when adding a new learning topic to the database and integrating it with the UI.
---

# Add Topic Skill

This skill outlines the standard workflow and conventions for adding learning topics to the Learning Path Tracker repository.

## Reusable Workflow

1. **Database Verification**: Ensure `prisma/schema.prisma` contains the `Topic` model and correct relationships.
2. **API Endpoint**: Define or modify route handlers inside `app/api/topics/route.ts` and `app/api/topics/[id]/route.ts`.
3. **Optimistic State Management**: Update the state array using an optimistic update so the UI reacts instantly before the network completes.
4. **Validation**: Check that title is provided, description is truncated or formatted, and category fits inside predefined lists.
5. **Compilation Check**: Always run `npx tsc --noEmit` to verify type safety.

## Database & UI Conventions

- **Default Status**: Newly created topics must default to status `NOT_STARTED` and priority `MEDIUM`.
- **Predefined Categories**: `Programming`, `Architecture`, `Frontend`, `Databases`, `DevOps`, `Backend`.
- **Subtopics Insertion**: Ensure that if subtopics are supplied as comma-separated lists during creation, they are mapped to the child `Subtopic` model with `isCompleted: false`.

## Example Request Payload

```json
{
  "title": "Docker Containerization",
  "category": "DevOps",
  "description": "Mastering container setups, multi-stage builds, and docker-compose.",
  "priority": "HIGH",
  "subtopics": ["Images and Containers", "Data Volumes", "Compose Workflows"]
}
```

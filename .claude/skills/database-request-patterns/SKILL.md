# Database Request Patterns Skill

Purpose:
Ensure safe, optimized, and maintainable database interactions.

Rules:
- Always use Prisma ORM.
- Never use raw SQL queries.
- Minimize unnecessary database requests.
- Use proper filtering and indexing patterns.
- Use transactions where multiple dependent writes occur.
- Avoid N+1 query problems.
- Fetch only required fields using select/include.

Database Standards:
- Maintain relational integrity.
- Use cascade deletion correctly.
- Use indexed fields for filtering.
- Keep query logic inside API routes.
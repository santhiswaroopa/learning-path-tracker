---
name: dashboard-summary
description: Use when updating the main dashboard statistics, streaks, weekly goals, or recent activities.
---

# Dashboard Summary Skill

This skill explains how dashboard statistics, metrics, streaks, and activities are computed.

## Reusable Workflow

1. **API Integration**: The endpoint `/api/dashboard` compiles stats. When updating metrics, ensure changes match both query handlers and page props.
2. **Overall Progress Calculation**:
   - Count all subtopics.
   - Count completed subtopics.
   - Overall Progress % = `Math.round((completedSubtopics / totalSubtopics) * 100)`.
3. **Streak Tracker**:
   - Streaks are computed in days of continuous activity (subtopic completions or note additions).
   - Display a 7-day layout (M, T, W, T, F, S, S) with flames on completed days.
4. **Weekly Goal**:
   - Compare completed days in the current week against `weeklyGoal` (e.g. 5 days).
5. **Activity Stream**:
   - Recent items are formatted as: `note_added` (violet), `subtopic_done` (blue), or `topic_completed` (emerald).

## Layout Structure

- Banner (Overall Progress % + Streak status) -> Top.
- StatCards Grid (Topics, Completed, Notes, Streak) -> Middle.
- Topics Progress (left) + Streak Days (right) -> Middle-Bottom.
- Quick Revision Deck -> Bottom (above Recent Activity).
- Recent Activity Feed -> Bottom.

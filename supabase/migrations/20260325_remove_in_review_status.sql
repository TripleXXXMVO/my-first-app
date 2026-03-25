-- PROJ-3 BUG-1: Remove 'in_review' status (not in spec, only 3 statuses: todo/in_progress/done)
-- Convert existing in_review tasks to in_progress before dropping constraint

UPDATE tasks SET status = 'in_progress' WHERE status = 'in_review';

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo', 'in_progress', 'done'));

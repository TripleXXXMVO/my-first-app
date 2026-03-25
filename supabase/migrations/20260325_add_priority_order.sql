-- PROJ-3 BUG-2: Add priority_order generated column for correct sort order (high > medium > low)

ALTER TABLE tasks ADD COLUMN priority_order INTEGER GENERATED ALWAYS AS (
  CASE priority
    WHEN 'high'   THEN 3
    WHEN 'medium' THEN 2
    WHEN 'low'    THEN 1
    ELSE 0
  END
) STORED;

CREATE INDEX idx_tasks_user_priority_order ON tasks(user_id, priority_order);

import { useState } from "react";

import { type TaskType } from "../types/TaskType";
import { InlineEditForm } from "./InlineEditForm";

interface TaskRowProps {
  task: TaskType;
  onToggle: (task: TaskType) => void;
  onEdit: (task: TaskType, text: string) => Promise<void>;
  onRemove: (task: TaskType) => void;
}

export function TaskRow({ task, onToggle, onEdit, onRemove }: TaskRowProps) {
  const [editing, setEditing] = useState(false);

  return (
    <li className={`row task-row ${task.done ? "done" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.text}
        className={`stamp ${task.done ? "done" : ""}`}
        onClick={() => onToggle(task)}
      />

      {editing ? (
        <InlineEditForm
          label="Editar tarefa"
          initialValue={task.text}
          maxLength={200}
          onSave={async (text) => {
            await onEdit(task, text);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="row-body">
            <span className="task-text">{task.text}</span>
          </div>

          <div className="row-actions">
            <button
              type="button"
              className="action-btn edit"
              aria-label={`Editar "${task.text}"`}
              onClick={() => setEditing(true)}
            >
              Editar
            </button>
            <button
              type="button"
              className="action-btn del"
              aria-label={`Excluir "${task.text}"`}
              onClick={() => onRemove(task)}
            >
              Excluir
            </button>
          </div>
        </>
      )}
    </li>
  );
}

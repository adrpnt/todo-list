import { useState } from "react";
import { Link } from "react-router";

import { type ListType } from "../types/ListType";
import { plural } from "../utils/plural";
import { InlineEditForm } from "./InlineEditForm";

interface ListRowProps {
  list: ListType;
  onRename: (list: ListType, title: string) => Promise<void>;
  onRemove: (list: ListType) => void;
}

function describe(list: ListType) {
  if (list.totalTasks === 0) {
    return "nenhuma tarefa";
  }

  if (list.pendingTasks === 0) {
    return `concluída · ${plural(list.totalTasks, "tarefa", "tarefas")}`;
  }

  return `${plural(list.pendingTasks, "pendente", "pendentes")} de ${list.totalTasks}`;
}

export function ListRow({ list, onRename, onRemove }: ListRowProps) {
  const [editing, setEditing] = useState(false);
  const completed = list.totalTasks > 0 && list.pendingTasks === 0;

  return (
    <li className="row list-row">
      <span className={`stamp ${completed ? "done" : ""}`} aria-hidden="true" />

      {editing ? (
        <InlineEditForm
          label="Renomear lista"
          initialValue={list.title}
          maxLength={80}
          onSave={async (title) => {
            await onRename(list, title);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="row-body">
            <Link to={`/lists/${list.id}`} className="list-link">
              {list.title}
            </Link>
            <div className="row-meta">{describe(list)}</div>
          </div>

          <div className="row-actions">
            <button
              type="button"
              className="action-btn edit"
              aria-label={`Renomear "${list.title}"`}
              onClick={() => setEditing(true)}
            >
              Renomear
            </button>
            <button
              type="button"
              className="action-btn del"
              aria-label={`Excluir "${list.title}"`}
              onClick={() => onRemove(list)}
            >
              Excluir
            </button>
          </div>
        </>
      )}
    </li>
  );
}

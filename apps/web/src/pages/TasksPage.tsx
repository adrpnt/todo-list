import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { Alert } from "../components/Alert";
import { EntryForm } from "../components/EntryForm";
import { Letterhead } from "../components/Letterhead";
import { TaskRow } from "../components/TaskRow";
import { ApiError, api, getErrorMessage } from "../services/api";
import { type ListType } from "../types/ListType";
import { type TaskType } from "../types/TaskType";
import { plural } from "../utils/plural";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; list: ListType }
  | { status: "not-found" }
  | { status: "error"; message: string };

export function TasksPage() {
  const { listId } = useParams();
  const id = Number(listId);

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [error, setError] = useState("");

  const pendingTasks = useMemo(
    () => tasks.filter((task) => !task.done).length,
    [tasks],
  );

  useEffect(() => {
    let active = true;

    Promise.all([api.lists.get(id), api.lists.tasks(id)])
      .then(([list, data]) => {
        if (!active) return;
        setTasks(data);
        setState({ status: "ready", list });
      })
      .catch((err) => {
        if (!active) return;
        setState(
          err instanceof ApiError && err.status === 404
            ? { status: "not-found" }
            : { status: "error", message: getErrorMessage(err) },
        );
      });

    return () => {
      active = false;
    };
  }, [id]);

  function replaceTask(updated: TaskType) {
    setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
  }

  async function handleAdd(text: string) {
    const task = await api.lists.addTask(id, text);
    setTasks((prev) => [...prev, task]);
  }

  async function handleToggle(task: TaskType) {
    try {
      replaceTask(await api.tasks.update(task.id, { done: !task.done }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleEdit(task: TaskType, text: string) {
    replaceTask(await api.tasks.update(task.id, { text }));
  }

  async function handleRemove(task: TaskType) {
    try {
      await api.tasks.remove(task.id);
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const backLink = (
    <Link to="/" className="back-link">
      ← todas as listas
    </Link>
  );

  if (state.status === "loading") {
    return <p className="loading-screen">Carregando tarefas…</p>;
  }

  if (state.status === "not-found" || state.status === "error") {
    return (
      <>
        {backLink}
        <Letterhead
          eyebrow="Ops"
          title={state.status === "not-found" ? "Lista não encontrada" : "Algo deu errado"}
          showDate={false}
        />
        {state.status === "error" && <p className="footer-note">{state.message}</p>}
      </>
    );
  }

  return (
    <>
      {backLink}
      <Letterhead eyebrow="Lista" title={state.list.title} />

      <section className="ledger ruled" aria-labelledby="tasks-heading">
        <div className="ledger-head">
          <h2 id="tasks-heading">TAREFAS</h2>
          <span className="count">
            {plural(pendingTasks, "pendente", "pendentes")}
          </span>
        </div>

        <EntryForm
          label="Nova tarefa"
          placeholder="Escrever nova tarefa"
          buttonLabel="Adicionar"
          maxLength={200}
          onSubmit={handleAdd}
        />

        {error && <Alert message={error} onClose={() => setError("")} />}

        {tasks.length === 0 ? (
          <p className="empty-state">Nenhuma tarefa nesta lista ainda.</p>
        ) : (
          <ul className="rows">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onRemove={handleRemove}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="footer-note">cada tarefa concluída recebe o carimbo</div>
    </>
  );
}

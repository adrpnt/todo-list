import { useEffect, useRef, useMemo, useState } from "react";

import { type TaskType } from "./types/TaskType";

import "./App.css";

const STORAGE_TASKS_KEY = "@tasks";

function App() {
  const firstRender = useRef(true);
  const inputTaskRef = useRef<HTMLInputElement>(null);

  const [task, setTask] = useState<string>("");
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [editMode, setEditMode] = useState({ enabled: false, task: {} });

  const totalTasks = useMemo(() => {
    return tasks.filter((item) => item.done === false).length;
  }, [tasks]);

  useEffect(() => {
    const storagedTasks = localStorage.getItem(STORAGE_TASKS_KEY);

    if (storagedTasks) {
      setTasks(JSON.parse(storagedTasks));
    }
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  function updateTask() {
    const findIndexTask = tasks.findIndex((item) => item === editMode.task);
    const allTasks = [...tasks];

    allTasks[findIndexTask].text = task;
    setTasks(allTasks);

    setEditMode({ enabled: false, task: {} });
    setTask("");
  }

  function handleUpsert() {
    if (!task) {
      alert("Preencha o texto da sua tarefa!");
      return;
    }

    if (editMode.enabled) {
      updateTask();
      return;
    }

    setTasks((prev) => [...prev, { text: task, done: false }]);
    setTask("");
  }

  function handleEdit(item: TaskType) {
    inputTaskRef.current?.focus();

    setTask(item.text);
    setEditMode({ enabled: true, task: item });
  }

  function handleDone(idx: number, item: TaskType) {
    const allTasks = [...tasks];

    item.done = !item.done;

    allTasks[idx] = item;
    setTasks(allTasks);
  }

  function handleRemove(item: TaskType) {
    const dataTasks = tasks.filter((task) => task !== item);
    setTasks(dataTasks);
  }

  return (
    <>
      <div className="page">
        <header className="letterhead">
          <div className="eyebrow">Livro de registros</div>
          <h1>Tarefas do dia</h1>
          <div className="date" id="today"></div>
        </header>

        <div className="ledger">
          <div className="ledger-head">
            <h2>TAREFAS</h2>
            <span className="count" id="count">
              {totalTasks} pendentes
            </span>
          </div>

          <form className="new-entry new-entry-top" id="new-task-form">
            <div className="stamp"></div>

            <input
              type="text"
              id="new-task-input"
              placeholder="Escrever nova tarefa"
              value={task}
              ref={inputTaskRef}
              onChange={(e) => setTask(e.target.value)}
            />

            <button
              type="button"
              className="add-btn"
              id="add-btn"
              onClick={handleUpsert}
            >
              {editMode.enabled ? "Atualizar" : "Adicionar"}
            </button>
          </form>

          <div id="task-list">
            {tasks.map((task, idx) => (
              <div className={`task-row ${task.done ? "done" : ""}`} key={idx}>
                <button
                  type="button"
                  className={`stamp ${task.done ? "done" : ""}`}
                  onClick={() => handleDone(idx, task)}
                ></button>

                <div className="task-body">
                  <div className="task-text">{task.text}</div>
                </div>

                <div className="row-actions">
                  <button
                    type="button"
                    className="action-btn edit"
                    onClick={() => handleEdit(task)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="action-btn del"
                    onClick={() => handleRemove(task)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-note">
          cada tarefa concluída recebe o carimbo
        </div>
      </div>
    </>
  );
}

export default App;

import { useEffect, useState } from "react";

import { Alert } from "../components/Alert";
import { EntryForm } from "../components/EntryForm";
import { Letterhead } from "../components/Letterhead";
import { ListRow } from "../components/ListRow";
import { useAuth } from "../hooks/useAuth";
import { api, getErrorMessage } from "../services/api";
import { type ListType } from "../types/ListType";
import { plural } from "../utils/plural";

export function ListsPage() {
  const { user } = useAuth();

  const [lists, setLists] = useState<ListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api.lists
      .all()
      .then((data) => active && setLists(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(title: string) {
    const list = await api.lists.create(title);
    setLists((prev) => [...prev, list]);
  }

  async function handleRename(list: ListType, title: string) {
    const updated = await api.lists.update(list.id, title);
    setLists((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function handleRemove(list: ListType) {
    if (!window.confirm(`Excluir a lista "${list.title}" e todas as suas tarefas?`)) {
      return;
    }

    try {
      await api.lists.remove(list.id);
      setLists((prev) => prev.filter((item) => item.id !== list.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <>
      <Letterhead eyebrow={`Olá, ${firstName}`} title="Suas listas" />

      <section className="ledger ruled" aria-labelledby="lists-heading">
        <div className="ledger-head">
          <h2 id="lists-heading">LISTAS</h2>
          <span className="count">{plural(lists.length, "lista", "listas")}</span>
        </div>

        <EntryForm
          label="Nova lista"
          placeholder="Nomear nova lista"
          buttonLabel="Criar"
          maxLength={80}
          onSubmit={handleCreate}
        />

        {error && <Alert message={error} onClose={() => setError("")} />}

        {loading ? (
          <p className="empty-state">Carregando listas…</p>
        ) : lists.length === 0 ? (
          <p className="empty-state">Nenhuma lista ainda. Crie a primeira acima.</p>
        ) : (
          <ul className="rows">
            {lists.map((list) => (
              <ListRow
                key={list.id}
                list={list}
                onRename={handleRename}
                onRemove={handleRemove}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

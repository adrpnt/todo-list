import { type FormEvent, useState } from "react";

import { getErrorMessage } from "../services/api";

interface EntryFormProps {
  label: string;
  placeholder: string;
  buttonLabel: string;
  maxLength: number;
  onSubmit: (value: string) => Promise<void>;
}

/** Linha de "novo registro" no topo do livro (nova lista ou nova tarefa). */
export function EntryForm({
  label,
  placeholder,
  buttonLabel,
  maxLength,
  onSubmit,
}: EntryFormProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = value.trim();

    if (!text) {
      setError("Escreva algo antes de adicionar.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onSubmit(text);
      setValue("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="new-entry" onSubmit={handleSubmit}>
        <span className="stamp" aria-hidden="true" />

        <input
          type="text"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(event) => setValue(event.target.value)}
        />

        <button type="submit" className="add-btn" disabled={submitting}>
          {buttonLabel}
        </button>
      </form>

      {error && (
        <p className="entry-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

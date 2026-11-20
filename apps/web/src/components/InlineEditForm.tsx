import { type FormEvent, type KeyboardEvent, useState } from "react";

import { getErrorMessage } from "../services/api";

interface InlineEditFormProps {
  label: string;
  initialValue: string;
  maxLength: number;
  onSave: (value: string) => Promise<void>;
  onCancel: () => void;
}

export function InlineEditForm({
  label,
  initialValue,
  maxLength,
  onSave,
  onCancel,
}: InlineEditFormProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = value.trim();

    if (!text) {
      setError("O texto não pode ficar vazio.");
      return;
    }

    if (text === initialValue) {
      onCancel();
      return;
    }

    setSaving(true);

    try {
      await onSave(text);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div className="edit-block">
      <form className="edit-form" onSubmit={handleSubmit}>
        <input
          type="text"
          aria-label={label}
          value={value}
          maxLength={maxLength}
          autoFocus
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="action-btn save" disabled={saving}>
          Salvar
        </button>
        <button type="button" className="action-btn" onClick={onCancel}>
          Cancelar
        </button>
      </form>

      {error && (
        <p className="entry-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

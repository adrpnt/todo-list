import { type FormEvent, useId, useState } from "react";
import { Link } from "react-router";

import { Letterhead } from "../components/Letterhead";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../services/api";

export function RegisterPage() {
  const { register } = useAuth();
  const passwordId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register(name, email, password);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <Letterhead eyebrow="Novo livro" title="Criar conta" showDate={false} />

      <section className="ledger auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nome</span>
            <input
              type="text"
              autoComplete="name"
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <div className="field">
            <label htmlFor={passwordId}>Senha</label>
            <input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              aria-describedby={`${passwordId}-hint`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <small id={`${passwordId}-hint`} className="field-hint">
              mínimo de 8 caracteres
            </small>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="add-btn block" disabled={submitting}>
            {submitting ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <p className="auth-switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </>
  );
}

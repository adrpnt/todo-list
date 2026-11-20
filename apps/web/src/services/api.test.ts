import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, api, onUnauthorized } from "./api";

function jsonResponse(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    onUnauthorized(null);
  });

  it("envia JSON para /api e devolve o corpo da resposta", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1, title: "Mercado" }));

    const list = await api.lists.create("Mercado");

    expect(list).toEqual({ id: 1, title: "Mercado" });
    expect(fetchMock).toHaveBeenCalledWith("/api/lists", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Mercado" }),
    });
  });

  it("devolve undefined em respostas 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(api.tasks.remove(1)).resolves.toBeUndefined();
  });

  it("lança ApiError com a mensagem do servidor", async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: "Título é obrigatório" }));

    const error = await api.lists.create("").catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: "Título é obrigatório" });
  });

  it("usa uma mensagem genérica quando o servidor não está acessível", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(api.lists.all()).rejects.toMatchObject({
      status: 0,
      message: "Não foi possível conectar ao servidor.",
    });
  });

  it("avisa o handler registrado quando a resposta é 401", async () => {
    const handler = vi.fn();
    onUnauthorized(handler);
    fetchMock.mockResolvedValue(jsonResponse(401, { error: "Sessão inválida ou expirada" }));

    await expect(api.lists.all()).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledOnce();
  });
});

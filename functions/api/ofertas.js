export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  /*
   * =====================================
   * GET — listar promoções
   * =====================================
   */

  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT id, titulo, categoria, data, link, imagem, criado_em FROM promocoes ORDER BY data DESC, id DESC"
    ).all();

    return new Response(
      JSON.stringify({ ofertas: results || [] }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
        }
      }
    );
  }

  /*
   * =====================================
   * SEGURANÇA
   * =====================================
   */

  const password = request.headers.get("X-Admin-Password");

  if (!password || password !== env.ADMIN_PASSWORD) {
    return Response.json(
      { error: "Palavra-passe inválida." },
      { status: 401 }
    );
  }

  /*
   * =====================================
   * POST — adicionar promoção
   * =====================================
   */

  if (request.method === "POST") {
    const body = await request.json();

    const titulo = String(body.titulo || "").trim();
    const categoria = String(body.categoria || "").trim();
    const data = String(body.data || "").trim();
    const link = String(body.link || "").trim();
    const imagem = String(body.imagem || "").trim();

    if (!titulo || !categoria || !data || !link || !imagem) {
      return Response.json(
        { error: "Faltam dados da promoção." },
        { status: 400 }
      );
    }

    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM promocoes WHERE data = ?"
    )
      .bind(data)
      .first();

    if ((count?.total || 0) >= 5) {
      return Response.json(
        { error: "Já existem 5 promoções para esta data." },
        { status: 409 }
      );
    }

    const result = await env.DB.prepare(
      "INSERT INTO promocoes (titulo, categoria, data, link, imagem) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(titulo, categoria, data, link, imagem)
      .run();

    return Response.json(
      {
        ok: true,
        id: result.meta.last_row_id
      },
      { status: 201 }
    );
  }

  /*
   * =====================================
   * PUT — editar promoção
   * =====================================
   */

  if (request.method === "PUT") {
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "ID da promoção em falta." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const titulo = String(body.titulo || "").trim();
    const categoria = String(body.categoria || "").trim();
    const data = String(body.data || "").trim();
    const link = String(body.link || "").trim();
    const imagem = String(body.imagem || "").trim();

    if (!titulo || !categoria || !data || !link || !imagem) {
      return Response.json(
        { error: "Faltam dados da promoção." },
        { status: 400 }
      );
    }

    /*
     * Verificar se a promoção existe
     */

    const existente = await env.DB.prepare(
      "SELECT id FROM promocoes WHERE id = ?"
    )
      .bind(id)
      .first();

    if (!existente) {
      return Response.json(
        { error: "Promoção não encontrada." },
        { status: 404 }
      );
    }

    /*
     * Verificar limite de 5 promoções
     * para a nova data.
     *
     * Excluímos a própria promoção
     * da contagem.
     */

    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM promocoes WHERE data = ? AND id != ?"
    )
      .bind(data, id)
      .first();

    if ((count?.total || 0) >= 5) {
      return Response.json(
        { error: "Já existem 5 promoções para esta data." },
        { status: 409 }
      );
    }

    /*
     * Atualizar promoção
     */

    await env.DB.prepare(
      `UPDATE promocoes
       SET titulo = ?, categoria = ?, data = ?, link = ?, imagem = ?
       WHERE id = ?`
    )
      .bind(
        titulo,
        categoria,
        data,
        link,
        imagem,
        id
      )
      .run();

    return Response.json({
      ok: true,
      id
    });
  }

  /*
   * =====================================
   * DELETE — apagar promoção
   * =====================================
   */

  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");

    if (id) {
      await env.DB.prepare(
        "DELETE FROM promocoes WHERE id = ?"
      )
        .bind(id)
        .run();
    } else {
      await env.DB.prepare(
        "DELETE FROM promocoes"
      ).run();
    }

    return Response.json({
      ok: true
    });
  }

  /*
   * =====================================
   * MÉTODO NÃO PERMITIDO
   * =====================================
   */

  return new Response(
    "Method Not Allowed",
    { status: 405 }
  );
}

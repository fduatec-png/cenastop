export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  /* =====================================
     GET — LISTAR PROMOÇÕES
  ===================================== */

  if (request.method === "GET") {

    const { results } = await env.DB.prepare(
      "SELECT id, titulo, categoria, data, link, imagem, criado_em FROM promocoes ORDER BY data DESC, id DESC"
    ).all();

    return new Response(
      JSON.stringify({
        ofertas: results || []
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
        }
      }
    );
  }


  /* =====================================
     AUTENTICAÇÃO ADMIN
  ===================================== */

  const password =
    request.headers.get("X-Admin-Password");

  if (
    !password ||
    password !== env.ADMIN_PASSWORD
  ) {
    return Response.json(
      {
        error: "Palavra-passe inválida."
      },
      {
        status: 401
      }
    );
  }


  /* =====================================
     POST — NOVA PROMOÇÃO
  ===================================== */

  if (request.method === "POST") {

    const body =
      await request.json();

    const titulo =
      String(body.titulo || "").trim();

    const categoria =
      String(body.categoria || "").trim();

    const data =
      String(body.data || "").trim();

    const link =
      String(body.link || "").trim();

    const imagem =
      String(body.imagem || "").trim();


    if (
      !titulo ||
      !categoria ||
      !data ||
      !link ||
      !imagem
    ) {

      return Response.json(
        {
          error:
            "Faltam dados da promoção."
        },
        {
          status: 400
        }
      );

    }


    const count =
      await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM promocoes WHERE data = ?"
      )
      .bind(data)
      .first();


    if (
      (count?.total || 0) >= 5
    ) {

      return Response.json(
        {
          error:
            "Já existem 5 promoções para esta data."
        },
        {
          status: 409
        }
      );

    }


    const result =
      await env.DB.prepare(
        `INSERT INTO promocoes
        (titulo, categoria, data, link, imagem)
        VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        titulo,
        categoria,
        data,
        link,
        imagem
      )
      .run();


    return Response.json(
      {
        ok: true,
        id: result.meta.last_row_id
      },
      {
        status: 201
      }
    );

  }


  /* =====================================
     PUT — EDITAR PROMOÇÃO
  ===================================== */

  if (request.method === "PUT") {

    const id =
      url.searchParams.get("id");


    if (!id) {

      return Response.json(
        {
          error:
            "ID da promoção não indicado."
        },
        {
          status: 400
        }
      );

    }


    const body =
      await request.json();


    const titulo =
      String(body.titulo || "").trim();

    const categoria =
      String(body.categoria || "").trim();

    const data =
      String(body.data || "").trim();

    const link =
      String(body.link || "").trim();

    const imagem =
      String(body.imagem || "").trim();


    if (
      !titulo ||
      !categoria ||
      !data ||
      !link
    ) {

      return Response.json(
        {
          error:
            "Faltam dados da promoção."
        },
        {
          status: 400
        }
      );

    }


    /* =====================================
       VERIFICAR SE EXISTE
    ===================================== */

    const existente =
      await env.DB.prepare(
        "SELECT id, imagem FROM promocoes WHERE id = ?"
      )
      .bind(id)
      .first();


    if (!existente) {

      return Response.json(
        {
          error:
            "Promoção não encontrada."
        },
        {
          status: 404
        }
      );

    }


    /* =====================================
       MANTER IMAGEM ANTIGA
       SE NÃO FOI ENVIADA NOVA
    ===================================== */

    const imagemFinal =
      imagem || existente.imagem;


    /* =====================================
       LIMITAR A 5 POR DATA
    ===================================== */

    const count =
      await env.DB.prepare(
        `SELECT COUNT(*) AS total
         FROM promocoes
         WHERE data = ?
         AND id != ?`
      )
      .bind(data, id)
      .first();


    if (
      (count?.total || 0) >= 5
    ) {

      return Response.json(
        {
          error:
            "Já existem 5 promoções para esta data."
        },
        {
          status: 409
        }
      );

    }


    /* =====================================
       ATUALIZAR
    ===================================== */

    await env.DB.prepare(
      `UPDATE promocoes
       SET titulo = ?,
           categoria = ?,
           data = ?,
           link = ?,
           imagem = ?
       WHERE id = ?`
    )
    .bind(
      titulo,
      categoria,
      data,
      link,
      imagemFinal,
      id
    )
    .run();


    return Response.json({
      ok: true,
      id
    });

  }


  /* =====================================
     DELETE — APAGAR
  ===================================== */

 if (request.method === "DELETE") {

  const id = url.searchParams.get("id");

  if (id) {

    const result = await env.DB.prepare(
      "DELETE FROM promocoes WHERE id = ?"
    )
    .bind(id)
    .run();

    return Response.json({
      ok: true,
      deleted: result.meta.changes || 0
    });

  } else {

    const result = await env.DB.prepare(
      "DELETE FROM promocoes"
    )
    .run();

    return Response.json({
      ok: true,
      deleted: result.meta.changes || 0
    });

  }
}


  /* =====================================
     MÉTODO NÃO PERMITIDO
  ===================================== */

  return new Response(
    "Method Not Allowed",
    {
      status: 405
    }
  );
}

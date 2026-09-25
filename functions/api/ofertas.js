export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  /* =====================================
     GET — LISTAR PROMOÇÕES
  ===================================== */

  if (request.method === "GET") {

    const { results } = await env.DB.prepare(
      "SELECT id, titulo, marca, marca_id, categoria, data, link, imagem, criado_em FROM promocoes ORDER BY data DESC, id DESC"
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

    const marca =
      String(body.marca || "").trim();

    const marcaId =
      body.marca_id
        ? Number(body.marca_id)
        : null;

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


    /* =====================================
       GUARDAR NA D1
    ===================================== */

    const result =
      await env.DB.prepare(
        `INSERT INTO promocoes
        (titulo, marca, marca_id, categoria, data, link, imagem)
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        titulo,
        marca,
        marcaId,
        categoria,
        data,
        link,
        imagem
      )
      .run();


    /* =====================================
       PUBLICAR NO FACEBOOK
    ===================================== */
let facebookPublicado = false;

try {

  if (env.FACEBOOK_PAGE_ACCESS_TOKEN) {

    const accessToken =
      env.FACEBOOK_PAGE_ACCESS_TOKEN;

    const mensagemFacebook =
      `${titulo}\n\n${link}`;

    /*
     * A imagem está guardada como:
     * data:image/webp;base64,...
     *
     * Vamos convertê-la para ficheiro
     * e enviá-la primeiro para o Facebook.
     */

    const partesImagem =
      imagem.split(",");

    if (
      partesImagem.length < 2 ||
      !partesImagem[0].startsWith("data:")
    ) {

      throw new Error(
        "Formato da imagem inválido."
      );

    }

    const cabecalhoImagem =
      partesImagem[0];

    const base64Imagem =
      partesImagem[1];

    const mimeMatch =
      cabecalhoImagem.match(
        /data:(.*?);base64/
      );

    const mimeType =
      mimeMatch
        ? mimeMatch[1]
        : "image/webp";

    const bytes =
      Uint8Array.from(
        atob(base64Imagem),
        c => c.charCodeAt(0)
      );

    const formData =
      new FormData();

    formData.append(
      "source",
      new Blob(
        [bytes],
        {
          type: mimeType
        }
      ),
      "promocao.webp"
    );

    formData.append(
      "published",
      "false"
    );

    formData.append(
      "access_token",
      accessToken
    );

    /*
     * 1. Enviar a imagem para o Facebook
     */

    const fotoResponse =
      await fetch(
        "https://graph.facebook.com/v26.0/669735022899305/photos",
        {
          method: "POST",
          body: formData
        }
      );

    const fotoData =
      await fotoResponse.json();

    if (!fotoResponse.ok) {

      console.error(
        "Erro ao enviar imagem para Facebook:",
        fotoData
      );

    } else {

      /*
       * 2. Criar a publicação com:
       *    - título
       *    - link
       *    - imagem
       */

      const publicacaoResponse =
        await fetch(
          "https://graph.facebook.com/v26.0/669735022899305/feed",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded"
            },
            body:
              new URLSearchParams({
                message:
                  mensagemFacebook,

                "attached_media[0]":
                  JSON.stringify({
                    media_fbid:
                      fotoData.id
                  }),

                access_token:
                  accessToken
              })
          }
        );

      const publicacaoData =
        await publicacaoResponse.json();

      if (!publicacaoResponse.ok) {

        console.error(
          "Erro ao publicar no Facebook:",
          publicacaoData
        );

      } else {

        facebookPublicado = true;

        console.log(
          "Facebook publicado:",
          publicacaoData
        );

      }

    }

  } else {

    console.error(
      "Secret FACEBOOK_PAGE_ACCESS_TOKEN não encontrado."
    );

  }

} catch (facebookError) {

  console.error(
    "Erro ao publicar no Facebook:",
    facebookError
  );

}

    /* =====================================
       RESPOSTA
    ===================================== */

    return Response.json(
      {
        ok: true,
        id: result.meta.last_row_id,
        facebook_publicado: facebookPublicado
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

    const marca =
      String(body.marca || "").trim();

    const marcaId =
      body.marca_id
        ? Number(body.marca_id)
        : null;

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
           marca = ?,
           marca_id = ?,
           categoria = ?,
           data = ?,
           link = ?,
           imagem = ?
       WHERE id = ?`
    )
    .bind(
      titulo,
      marca,
      marcaId,
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

    const id =
      url.searchParams.get("id");


    if (id) {

      const result =
        await env.DB.prepare(
          "DELETE FROM promocoes WHERE id = ?"
        )
        .bind(id)
        .run();

      return Response.json({
        ok: true,
        deleted:
          result.meta.changes || 0
      });

    } else {

      const result =
        await env.DB.prepare(
          "DELETE FROM promocoes"
        )
        .run();

      return Response.json({
        ok: true,
        deleted:
          result.meta.changes || 0
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

export async function onRequest(context) {
  const { params, env } = context;

  const slug = String(params.slug || "")
    .trim()
    .toLowerCase();

  if (!slug) {
    return new Response("Marca não indicada.", {
      status: 400
    });
  }

  // Procura a promoção mais recente dessa marca
  const promocao = await env.DB.prepare(
    `SELECT marca, link
     FROM promocoes
     WHERE LOWER(REPLACE(REPLACE(REPLACE(marca, ' ', '-'), '.', ''), '/', '-')) = ?
     ORDER BY data DESC, id DESC
     LIMIT 1`
  )
    .bind(slug)
    .first();

  if (!promocao || !promocao.link) {
    return new Response(
      "Promoção não encontrada.",
      {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8"
        }
      }
    );
  }

  return Response.redirect(promocao.link, 302);
}

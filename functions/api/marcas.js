export async function onRequest(context) {

    const { request, env } = context;
    const url = new URL(request.url);

    /* =====================================
       GET — LISTAR MARCAS
    ===================================== */

    if (request.method === "GET") {

        try {

            const result =
                await env.DB
                    .prepare(`
                        SELECT
                            id,
                            nome,
                            logo,
                            link,
                            criado_em
                        FROM marcas
                        ORDER BY nome ASC
                    `)
                    .all();

            return Response.json(
                {
                    marcas: result.results || []
                },
                {
                    headers: {
                        "Cache-Control":
                            "no-store, no-cache, must-revalidate, max-age=0"
                    }
                }
            );

        } catch (error) {

            console.error(error);

            return Response.json(
                {
                    error: "Não foi possível carregar as marcas."
                },
                {
                    status: 500
                }
            );
        }
    }


    /* =====================================
       VERIFICAR PALAVRA-PASSE
    ===================================== */

    const password =
        request.headers.get(
            "X-Admin-Password"
        );

    if (
        !password ||
        password !== env.ADMIN_PASSWORD
    ) {

        return Response.json(
            {
                error: "Não autorizado."
            },
            {
                status: 401
            }
        );
    }


    /* =====================================
       LER DADOS
    ===================================== */

    let body = {};

    if (
        request.method === "POST" ||
        request.method === "PUT"
    ) {

        try {

            body =
                await request.json();

        } catch {

            return Response.json(
                {
                    error: "Dados inválidos."
                },
                {
                    status: 400
                }
            );
        }
    }


    /* =====================================
       POST — CRIAR MARCA
    ===================================== */

    if (request.method === "POST") {

        const nome =
            String(body.nome || "").trim();

        const logo =
            String(body.logo || "").trim();

        const link =
            String(body.link || "").trim();


        if (!nome) {

            return Response.json(
                {
                    error: "Introduza o nome da marca."
                },
                {
                    status: 400
                }
            );
        }


        if (!logo) {

            return Response.json(
                {
                    error: "Introduza o logo da marca."
                },
                {
                    status: 400
                }
            );
        }


        if (!link) {

            return Response.json(
                {
                    error: "Introduza o link da marca."
                },
                {
                    status: 400
                }
            );
        }


        try {

            const result =
                await env.DB
                    .prepare(`
                        INSERT INTO marcas
                            (nome, logo, link)
                        VALUES
                            (?, ?, ?)
                    `)
                    .bind(
                        nome,
                        logo,
                        link
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

        } catch (error) {

            console.error(error);

            if (
                String(error.message || "")
                    .toLowerCase()
                    .includes("unique")
            ) {

                return Response.json(
                    {
                        error:
                            "Já existe uma marca com esse nome."
                    },
                    {
                        status: 409
                    }
                );
            }

            return Response.json(
                {
                    error:
                        "Não foi possível guardar a marca."
                },
                {
                    status: 500
                }
            );
        }
    }


    /* =====================================
       PUT — EDITAR MARCA
    ===================================== */

    if (request.method === "PUT") {

        const id =
            Number(url.searchParams.get("id"));


        if (!id) {

            return Response.json(
                {
                    error: "ID da marca em falta."
                },
                {
                    status: 400
                }
            );
        }


        const nome =
            String(body.nome || "").trim();

        const logo =
            String(body.logo || "").trim();

        const link =
            String(body.link || "").trim();


        if (!nome || !logo || !link) {

            return Response.json(
                {
                    error:
                        "Nome, logo e link são obrigatórios."
                },
                {
                    status: 400
                }
            );
        }


        try {

            const result =
                await env.DB
                    .prepare(`
                        UPDATE marcas
                        SET
                            nome = ?,
                            logo = ?,
                            link = ?
                        WHERE id = ?
                    `)
                    .bind(
                        nome,
                        logo,
                        link,
                        id
                    )
                    .run();


            if (
                !result.meta.changes
            ) {

                return Response.json(
                    {
                        error:
                            "Marca não encontrada."
                    },
                    {
                        status: 404
                    }
                );
            }


            return Response.json(
                {
                    ok: true
                }
            );

        } catch (error) {

            console.error(error);

            if (
                String(error.message || "")
                    .toLowerCase()
                    .includes("unique")
            ) {

                return Response.json(
                    {
                        error:
                            "Já existe uma marca com esse nome."
                    },
                    {
                        status: 409
                    }
                );
            }

            return Response.json(
                {
                    error:
                        "Não foi possível atualizar a marca."
                },
                {
                    status: 500
                }
            );
        }
    }


    /* =====================================
       DELETE — APAGAR MARCA
    ===================================== */

    if (request.method === "DELETE") {

        const id =
            Number(url.searchParams.get("id"));


        if (!id) {

            return Response.json(
                {
                    error: "ID da marca em falta."
                },
                {
                    status: 400
                }
            );
        }


        try {

            const result =
                await env.DB
                    .prepare(`
                        DELETE FROM marcas
                        WHERE id = ?
                    `)
                    .bind(id)
                    .run();


            if (
                !result.meta.changes
            ) {

                return Response.json(
                    {
                        error:
                            "Marca não encontrada."
                    },
                    {
                        status: 404
                    }
                );
            }


            return Response.json(
                {
                    ok: true,
                    deleted: result.meta.changes
                }
            );

        } catch (error) {

            console.error(error);

            return Response.json(
                {
                    error:
                        "Não foi possível apagar a marca."
                },
                {
                    status: 500
                }
            );
        }
    }


    /* =====================================
       MÉTODO NÃO SUPORTADO
    ===================================== */

    return Response.json(
        {
            error: "Método não suportado."
        },
        {
            status: 405
        }
    );
}

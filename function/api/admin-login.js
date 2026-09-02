export async function onRequest(context) {
    if (context.request.method !== "POST") {
        return new Response(
            JSON.stringify({
                error: "Método não permitido."
            }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );
    }

    try {
        const body = await context.request.json();
        const password = String(body.password || "");

        if (!password || password !== context.env.ADMIN_PASSWORD) {
            return new Response(
                JSON.stringify({
                    error: "Palavra-passe incorreta."
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "no-store"
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                ok: true
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({
                error: "Pedido inválido."
            }),
            {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );
    }
}

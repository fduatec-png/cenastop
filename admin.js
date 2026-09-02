/* =====================================
   ELEMENTOS
===================================== */

const form =
    document.querySelector("#offerForm");

const imageInput =
    document.querySelector("#image");

const preview =
    document.querySelector("#preview");

const offerList =
    document.querySelector("#offerList");

const offerCount =
    document.querySelector("#offerCount");

const clearAll =
    document.querySelector("#clearAll");

const dateInput =
    document.querySelector("#date");

const passwordInput =
    document.querySelector("#password");

const statusBox =
    document.querySelector("#status");

const contentType =
    document.querySelector("#contentType");


/* =====================================
   ESTADO
===================================== */

let modoEdicao = false;

let idEdicao = null;

let imagemAtual = "";


/* =====================================
   DATA DE HOJE
===================================== */

function obterHoje() {

    return new Date()
        .toISOString()
        .split("T")[0];

}


const hoje =
    obterHoje();

dateInput.value =
    hoje;


/* =====================================
   STATUS
===================================== */

function status(
    message,
    error = false
) {

    if (!statusBox) {
        return;
    }

    statusBox.textContent =
        message;

    statusBox.style.color =
        error
            ? "#b42318"
            : "#18864b";

}


/* =====================================
   PRÉ-VISUALIZAÇÃO
===================================== */

imageInput.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];

        preview.innerHTML = "";

        if (!file) {
            return;
        }

        const reader =
            new FileReader();

        reader.onload =
            event => {

                preview.innerHTML = `
                    <div>
                        <small>
                            Pré-visualização:
                        </small>
                    </div>

                    <img
                        src="${event.target.result}"
                        alt="Pré-visualização"
                    >
                `;

            };

        reader.readAsDataURL(file);

    }
);

/* =====================================
   TIPO DE CONTEÚDO
===================================== */

function atualizarTipoConteudo() {

    if (!contentType) {
        return;
    }

    const tipo = contentType.value;

    const brandFields =
        document.querySelector("#brandFields");

    /* Campos da marca */

    if (brandFields) {
        brandFields.hidden =
            tipo !== "marca";
    }

    const brandName =
        document.querySelector("#brandName");

    const brandLogo =
        document.querySelector("#brandLogo");

    const brandLink =
        document.querySelector("#brandLink");

    if (brandName) {
        brandName.required =
            tipo === "marca";
    }

    if (brandLogo) {
        brandLogo.required =
            tipo === "marca";
    }

    if (brandLink) {
        brandLink.required =
            tipo === "marca";
    }


    /* Campos da promoção */

    const camposPromocao = [
        "#title",
        "#brand",
        "#category",
        "#date",
        "#link",
        "#image"
    ];

    camposPromocao.forEach(
        selector => {

            const campo =
                document.querySelector(selector);

            if (!campo) {
                return;
            }

            const grupo =
                campo.closest(".form-group");

            if (grupo) {
                grupo.hidden =
                    tipo === "marca";
            }

            campo.required =
                tipo !== "marca";
        }
    );
}


/* Alterar entre Promoção e Marca */

if (contentType) {

    contentType.addEventListener(
        "change",
        atualizarTipoConteudo
    );

    atualizarTipoConteudo();
}
/* =====================================
   API
===================================== */

async function api(
    path,
    options = {}
) {

    const password =
        passwordInput.value;

    const headers =
        new Headers(
            options.headers || {}
        );


    headers.set(
        "X-Admin-Password",
        password
    );


    if (
        options.body &&
        !headers.has("Content-Type")
    ) {

        headers.set(
            "Content-Type",
            "application/json"
        );

    }


    const response =
        await fetch(
            path,
            {
                ...options,
                headers,
                cache: "no-store"
            }
        );


    const data =
        await response
            .json()
            .catch(
                () => ({})
            );


    if (!response.ok) {

        throw new Error(
            data.error ||
            `Erro ${response.status}`
        );

    }


    return data;

}


/* =====================================
   CARREGAR PROMOÇÕES
===================================== */

async function carregarPromocoes() {

    try {

        const response =
            await fetch(
                `/api/ofertas?t=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Erro ${response.status}`
            );

        }


        const data =
            await response.json();


        const promocoes =
            Array.isArray(
                data.ofertas
            )
                ? data.ofertas
                : [];


        mostrarPromocoes(
            promocoes
        );


    } catch (e) {

        console.error(e);

        status(
            "Não foi possível carregar as promoções.",
            true
        );

    }

}


/* =====================================
   MOSTRAR PROMOÇÕES
===================================== */

function mostrarPromocoes(
    promocoes
) {

    offerList.innerHTML = "";


    /* Ordenar por data mais recente */

    promocoes.sort(
        (a, b) => {

            const dataA =
                String(
                    a.data || ""
                );

            const dataB =
                String(
                    b.data || ""
                );


            if (dataA !== dataB) {
                return dataB.localeCompare(
                    dataA
                );
            }


            return Number(
                b.id || 0
            ) -
            Number(
                a.id || 0
            );

        }
    );


    /* Contador */

    offerCount.textContent =
        `${promocoes.length} promoção` +
        (
            promocoes.length === 1
                ? ""
                : "ões"
        );


    /* Nenhuma */

    if (!promocoes.length) {

        offerList.innerHTML = `
            <p>
                Ainda não existem promoções.
            </p>
        `;

        return;

    }


    /* Criar cartões */

    promocoes.forEach(
        promocao => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "offer-item";


            const imagem =
                promocao.imagem
                    ? `
                        <img
                            src="${escapeAttribute(
                                promocao.imagem
                            )}"
                            alt="${escapeAttribute(
                                promocao.titulo ||
                                "Promoção"
                            )}"
                        >
                    `
                    : `
                        <img
                            src=""
                            alt=""
                        >
                    `;


            item.innerHTML = `
    <img src="${promocao.imagem || ""}" alt="">

    <div>
        <h3>${escapeHtml(promocao.titulo)}</h3>
        <p>
            ${escapeHtml(promocao.categoria)}
            ·
            ${escapeHtml(promocao.data)}
        </p>
    </div>

    <div class="offer-actions">

        <button
            class="edit-button"
            data-id="${promocao.id}"
        >
            Editar
        </button>

        <button
            class="delete-button"
            data-id="${promocao.id}"
        >
            Apagar
        </button>

    </div>
`;


            offerList.appendChild(
                item
            );


            /* EDITAR */

            const editButton =
                item.querySelector(
                    ".edit-button"
                );


            editButton.addEventListener(
                "click",
                () => {

                    iniciarEdicao(
                        promocao
                    );

                }
            );


            /* APAGAR */

            const deleteButton =
                item.querySelector(
                    ".delete-button"
                );


            deleteButton.addEventListener(
                "click",
                async () => {

                    const confirmar =
                        confirm(
                            `Apagar a promoção "${promocao.titulo}"?`
                        );


                    if (!confirmar) {
                        return;
                    }


                    try {

                        status(
                            "A apagar promoção..."
                        );


                        await api(
                            `/api/ofertas?id=${encodeURIComponent(
                                deleteButton.dataset.id
                            )}`,
                            {
                                method: "DELETE"
                            }
                        );


                        await carregarPromocoes();


                        status(
                            "Promoção apagada com sucesso."
                        );


                    } catch (e) {

                        console.error(e);

                        status(
                            e.message,
                            true
                        );

                    }

                }
            );

        }
    );

}


/* =====================================
   SUBMETER
===================================== */

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();
const tipo = contentType ? contentType.value : "promocao";

if (tipo === "marca") {
    if (modoEdicao) {
        mostrarStatus("Cancele primeiro a edição da promoção.", true);
        return;
    }

    const nome = document.querySelector("#brandName").value.trim();
    const linkMarca = document.querySelector("#brandLink").value.trim();
    const logoFile = document.querySelector("#brandLogo").files[0];

    if (!nome) {
        mostrarStatus("Indique o nome da marca.", true);
        return;
    }

    if (!linkMarca) {
        mostrarStatus("Indique o link da marca.", true);
        return;
    }

    if (!logoFile) {
        mostrarStatus("Selecione o logo da marca.", true);
        return;
    }

    try {
        mostrarStatus("A guardar marca...");

        const logo = await comprimirImagem(logoFile);

        await api("/api/marcas", {
            method: "POST",
            body: JSON.stringify({
                nome: nome,
                logo: logo,
                link: linkMarca
            })
        });

        mostrarStatus("Marca adicionada com sucesso!");

        form.reset();

        if (dateInput) {
            dateInput.value = new Date().toISOString().split("T")[0];
        }

        if (preview) {
            preview.hidden = true;
            preview.src = "";
        }

        if (imageInput) {
            imageInput.required = true;
        }

        atualizarTipoConteudo();

    } catch (error) {
        console.error(error);
        mostrarStatus(error.message || "Erro ao guardar a marca.", true);
    }

    return;
}

        const title =
            document
                .querySelector("#title")
                .value
                .trim();
const brand =
    document
        .querySelector("#brand")
        .value
        .trim();

        const category =
            document
                .querySelector("#category")
                .value;


        const link =
            document
                .querySelector("#link")
                .value
                .trim();


        const date =
            dateInput.value;


        const file =
            imageInput.files[0];


        /* Validações */

        if (!title) {

            status(
                "Introduza o título.",
                true
            );

            return;

        }


        if (!category) {

            status(
                "Escolha uma categoria.",
                true
            );

            return;

        }


        if (!link) {

            status(
                "Introduza o link.",
                true
            );

            return;

        }


        if (!date) {

            status(
                "Escolha uma data.",
                true
            );

            return;

        }


        if (
            !modoEdicao &&
            !file
        ) {

            status(
                "Escolha uma imagem.",
                true
            );

            return;

        }


        if (!passwordInput.value) {

            status(
                "Introduza a palavra-passe de administração.",
                true
            );

            return;

        }


        try {

            let imagem =
                modoEdicao
                    ? imagemAtual
                    : "";


            /* Nova imagem */

            if (file) {

                status(
                    "A preparar a imagem..."
                );


                imagem =
                    await comprimirImagem(
                        file
                    );

            }


            /* =================================
               EDITAR
            ================================= */

            if (modoEdicao) {

                status(
                    "A atualizar promoção..."
                );


                await api(
                    `/api/ofertas?id=${encodeURIComponent(
                        idEdicao
                    )}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify({
                                titulo: title,
                               marca: brand,
                                categoria: category,
                                link: link,
                                data: date,
                                imagem: imagem
                            })
                    }
                );


                cancelarEdicao();


                await carregarPromocoes();


                status(
                    "Promoção atualizada com sucesso."
                );


            }


            /* =================================
               NOVA PROMOÇÃO
            ================================= */

            else {

                if (!imagem) {

                    status(
                        "Não foi possível preparar a imagem.",
                        true
                    );

                    return;

                }


                status(
                    "A guardar promoção..."
                );


                await api(
                    "/api/ofertas",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                titulo: title,
                               marca: brand,
                                categoria: category,
                                link: link,
                                data: date,
                                imagem: imagem
                            })
                    }
                );


                form.reset();

                dateInput.value =
                    obterHoje();

                preview.innerHTML = "";


                await carregarPromocoes();


                status(
                    "Promoção adicionada com sucesso."
                );

            }


        } catch (e) {

            console.error(e);

            status(
                e.message,
                true
            );

        }

    }
);


/* =====================================
   COMPRIMIR IMAGEM
===================================== */

async function comprimirImagem(
    file
) {

    const dataUrl =
        await new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload =
                    () => resolve(
                        reader.result
                    );


                reader.onerror =
                    reject;


                reader.readAsDataURL(
                    file
                );

            }
        );


    const img =
        await new Promise(
            (resolve, reject) => {

                const image =
                    new Image();


                image.onload =
                    () => resolve(
                        image
                    );


                image.onerror =
                    reject;


                image.src =
                    dataUrl;

            }
        );


    const max =
        1200;


    const scale =
        Math.min(
            1,
            max /
            Math.max(
                img.width,
                img.height
            )
        );


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        Math.round(
            img.width * scale
        );


    canvas.height =
        Math.round(
            img.height * scale
        );


    const ctx =
        canvas.getContext(
            "2d"
        );


    ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
    );


    return canvas.toDataURL(
        "image/webp",
        0.78
    );

}


/* =====================================
   INICIAR EDIÇÃO
===================================== */

function iniciarEdicao(
    promocao
) {

    modoEdicao =
        true;

    idEdicao =
        promocao.id;

    imagemAtual =
        promocao.imagem || "";


    document
        .querySelector("#title")
        .value =
            promocao.titulo || "";
document
    .querySelector("#brand")
    .value =
        promocao.marca || "";

    document
        .querySelector("#category")
        .value =
            promocao.categoria || "";


    document
        .querySelector("#link")
        .value =
            promocao.link || "";


    dateInput.value =
        promocao.data || "";


    imageInput.value =
        "";


    /*
     * Durante edição,
     * imagem não é obrigatória.
     */

    imageInput.required =
        false;


    /*
     * Mostrar imagem atual.
     */

    if (imagemAtual) {

        preview.innerHTML = `

            <div>
                <small>
                    Imagem atual:
                </small>
            </div>

            <img
                src="${escapeAttribute(
                    imagemAtual
                )}"
                alt="Imagem atual"
            >

            <p>
                Pode escolher uma nova imagem
                se quiser substituí-la.
            </p>

        `;

    } else {

        preview.innerHTML = "";

    }


    /*
     * Alterar botão.
     */

    const saveButton =
        form.querySelector(
            ".save-button"
        );


    if (saveButton) {

        saveButton.textContent =
            "Guardar alterações";

    }


    /*
     * Criar botão cancelar.
     */

    mostrarBotaoCancelar();


    status(
        `A editar: ${promocao.titulo}`
    );


    /*
     * Ir para o formulário.
     */

    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =====================================
   BOTÃO CANCELAR
===================================== */

function mostrarBotaoCancelar() {

    let cancelButton =
        document.querySelector(
            "#cancelEdit"
        );


    if (!cancelButton) {

        cancelButton =
            document.createElement(
                "button"
            );


        cancelButton.type =
            "button";


        cancelButton.id =
            "cancelEdit";


        cancelButton.className =
            "cancel-button";


        cancelButton.textContent =
            "Cancelar edição";


        const saveButton =
            form.querySelector(
                ".save-button"
            );


        saveButton.parentNode.insertBefore(
            cancelButton,
            saveButton
        );


        cancelButton.addEventListener(
            "click",
            () => {

                cancelarEdicao();


                status(
                    "Edição cancelada."
                );

            }
        );

    }


    cancelButton.style.display =
        "block";

}


/* =====================================
   CANCELAR EDIÇÃO
===================================== */

function cancelarEdicao() {

    modoEdicao =
        false;

    idEdicao =
        null;

    imagemAtual =
        "";


    form.reset();


    dateInput.value =
        obterHoje();


    imageInput.required =
        true;


    preview.innerHTML =
        "";


    const saveButton =
        form.querySelector(
            ".save-button"
        );


    if (saveButton) {

        saveButton.textContent =
            "Adicionar promoção";

    }


    const cancelButton =
        document.querySelector(
            "#cancelEdit"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }

}


/* =====================================
   APAGAR TODAS
===================================== */

clearAll.addEventListener(
    "click",
    async () => {

        const confirmar =
            confirm(
                "Tem a certeza que quer apagar TODAS as promoções?"
            );


        if (!confirmar) {
            return;
        }


        try {

            status(
                "A apagar todas as promoções..."
            );


            await api(
                "/api/ofertas",
                {
                    method: "DELETE"
                }
            );


            cancelarEdicao();


            await carregarPromocoes();


            status(
                "Todas as promoções foram apagadas."
            );


        } catch (e) {

            console.error(e);

            status(
                e.message,
                true
            );

        }

    }
);


/* =====================================
   SEGURANÇA HTML
===================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char])
    );

}


function escapeAttribute(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


/* =====================================
   INICIAR
===================================== */

carregarPromocoes();

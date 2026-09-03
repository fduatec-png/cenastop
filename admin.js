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

const brandList =
    document.querySelector("#brandList");

const brandCount =
    document.querySelector("#brandCount");

const clearAll =
    document.querySelector("#clearAll");

const dateInput =
    document.querySelector("#date");


const loginScreen =
    document.querySelector("#loginScreen");

const adminPanel =
    document.querySelector("#adminPanel");

const loginForm =
    document.querySelector("#loginForm");

const loginPassword =
    document.querySelector("#loginPassword");

const loginStatus =
    document.querySelector("#loginStatus");

let adminPassword =
    sessionStorage.getItem("adminPassword") || "";
const statusBox =
    document.querySelector("#status");

const contentType =
    document.querySelector("#contentType");

const brandSelect = document.querySelector("#brand");
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
    adminPassword;

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
   CARREGAR MARCAS
===================================== */

async function carregarMarcas() {

    try {

        const response =
            await fetch(
                `/api/marcas?t=${Date.now()}`,
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

        const marcas =
            Array.isArray(data.marcas)
                ? data.marcas
                : [];

        mostrarMarcas(marcas);

    } catch (e) {

        console.error(e);

        if (brandList) {
            brandList.innerHTML = `
                <p>
                    Não foi possível carregar as marcas.
                </p>
            `;
        }
    }
}

async function carregarMarcasNoSelect() {
    if (!brandSelect) return;

    try {
        const response = await fetch("/api/marcas?t=" + Date.now(), {
            cache: "no-store"
        });

        const data = await response.json();
        const marcas = data.marcas || [];

        brandSelect.innerHTML = `
            <option value="">Selecionar marca</option>
        `;

        marcas.forEach(marca => {
            const option = document.createElement("option");
            option.value = marca.id;
            option.textContent = marca.nome;
            brandSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar marcas:", error);
    }
}
/* =====================================
   MOSTRAR MARCAS
===================================== */

function mostrarMarcas(marcas) {

    if (!brandList) {
        return;
    }

    brandList.innerHTML = "";

    if (brandCount) {
        brandCount.textContent =
            `${marcas.length} marca` +
            (
                marcas.length === 1
                    ? ""
                    : "s"
            );
    }

    if (!marcas.length) {

        brandList.innerHTML = `
            <p>
                Ainda não existem marcas.
            </p>
        `;

        return;
    }

    marcas.forEach(marca => {

        const item =
            document.createElement("div");

        item.className =
            "offer-item";

        item.innerHTML = `
            <img
                src="${escapeAttribute(marca.logo || "")}"
                alt="${escapeAttribute(marca.nome || "Marca")}"
            >

          <div>
    <h3>
        ${escapeHtml(marca.nome)}
    </h3>
</div>

            <div class="offer-actions">

                <button
                    type="button"
                    class="edit-button brand-edit-button"
                >
                    Editar
                </button>

                <button
                    type="button"
                    class="delete-button brand-delete-button"
                >
                    Apagar
                </button>

            </div>
        `;

        brandList.appendChild(item);


        /* EDITAR MARCA */

        const editButton =
            item.querySelector(
                ".brand-edit-button"
            );

        editButton.addEventListener(
            "click",
            () => {

                const nome =
                    prompt(
                        "Nome da marca:",
                        marca.nome || ""
                    );

                if (nome === null) {
                    return;
                }

                const novoNome =
                    nome.trim();

                if (!novoNome) {
                    alert(
                        "Indique o nome da marca."
                    );
                    return;
                }


                const link =
                    prompt(
                        "Link da marca:",
                        marca.link || ""
                    );

                if (link === null) {
                    return;
                }

                const novoLink =
                    link.trim();

                if (!novoLink) {
                    alert(
                        "Indique o link da marca."
                    );
                    return;
                }


                editarMarca(
                    marca,
                    novoNome,
                    novoLink
                );

            }
        );


        /* APAGAR MARCA */

        const deleteButton =
            item.querySelector(
                ".brand-delete-button"
            );

        deleteButton.addEventListener(
            "click",
            () => {

                const confirmar =
                    confirm(
                        `Apagar a marca "${marca.nome}"?`
                    );

                if (!confirmar) {
                    return;
                }

                apagarMarca(
                    marca.id,
                    marca.nome
                );

            }
        );

    });
}

/* =====================================
   EDITAR MARCA
===================================== */

async function editarMarca(
    marca,
    novoNome,
    novoLink
) {

    try {

        status(
            "A atualizar marca..."
        );

        await api(
            `/api/marcas?id=${encodeURIComponent(
                marca.id
            )}`,
            {
                method: "PUT",

                body: JSON.stringify({
                    nome: novoNome,
                    logo: marca.logo,
                    link: novoLink
                })
            }
        );

        await carregarMarcas();

        status(
            "Marca atualizada com sucesso."
        );

    } catch (e) {

        console.error(e);

        status(
            e.message,
            true
        );

    }
}


/* =====================================
   APAGAR MARCA
===================================== */

async function apagarMarca(
    id,
    nome
) {

    try {

        status(
            "A apagar marca..."
        );

        await api(
            `/api/marcas?id=${encodeURIComponent(
                id
            )}`,
            {
                method: "DELETE"
            }
        );

        await carregarMarcas();

        status(
            `Marca "${nome}" apagada com sucesso.`
        );

    } catch (e) {

        console.error(e);

        status(
            e.message,
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
               /* =================================
           ADICIONAR MARCA
        ================================= */

       
const tipo = contentType ? contentType.value : "promocao";

if (tipo === "marca") {
    if (modoEdicao) {
        status("Cancele primeiro a edição da promoção.", true);
        return;
    }

    const nome = document.querySelector("#brandName").value.trim();
    const linkMarca = document.querySelector("#brandLink").value.trim();
    const logoFile = document.querySelector("#brandLogo").files[0];

    if (!nome) {
        status("Indique o nome da marca.", true);
        return;
    }

    if (!linkMarca) {
        status("Indique o link da marca.", true);
        return;
    }

    if (!logoFile) {
        status("Selecione o logo da marca.", true);
        return;
    }

    try {
        status("A guardar marca...");

        const logo = await comprimirImagem(logoFile);

        await api("/api/marcas", {
            method: "POST",
            body: JSON.stringify({
                nome: nome,
                logo: logo,
                link: linkMarca
            })
        });

        status("Marca adicionada com sucesso!");

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
await carregarMarcas();
    } catch (error) {
        console.error(error);
        status(error.message || "Erro ao guardar a marca.", true);
    }

    return;
}

        const title =
            document
                .querySelector("#title")
                .value
                .trim();
const brandId = document.querySelector("#brand").value;
const brandOption = document.querySelector("#brand option:checked");
const brand = brandOption ? brandOption.textContent.trim() : "";

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
    marca_id: brandId ? Number(brandId) : null,
    categoria: category,
    link: link,
    data: date,
    imagem: imagem
}
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
   EDITAR MARCA
===================================== */

async function editarMarca(marca, novoNome, novoLink) {

    try {

        status("A atualizar marca...");

        await api(
            `/api/marcas?id=${encodeURIComponent(marca.id)}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    nome: novoNome,
                    logo: marca.logo,
                    link: novoLink
                })
            }
        );

        await carregarMarcas();

        status("Marca atualizada com sucesso.");

    } catch (e) {

        console.error(e);

        status(
            e.message,
            true
        );

    }

}


/* =====================================
   APAGAR MARCA
===================================== */

async function apagarMarca(id, nome) {

    try {

        status("A apagar marca...");

        await api(
            `/api/marcas?id=${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await carregarMarcas();

        status(
            `Marca "${nome}" apagada com sucesso.`
        );

    } catch (e) {

        console.error(e);

        status(
            e.message,
            true
        );

    }

}
/* =====================================
   LOGIN
===================================== */

function mostrarPainel() {

    if (loginScreen) {
        loginScreen.hidden = true;
    }

    if (adminPanel) {
        adminPanel.hidden = false;
    }

}


function mostrarLogin() {

    if (loginScreen) {
        loginScreen.hidden = false;
    }

    if (adminPanel) {
        adminPanel.hidden = true;
    }

}


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const password =
                loginPassword.value.trim();

            if (!password) {
                loginStatus.textContent =
                    "Introduza a palavra-passe.";
                return;
            }

            loginStatus.textContent =
                "A verificar...";

            try {

                const response =
                    await fetch(
                        "/api/admin-login",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                password: password
                            }),
                            cache: "no-store"
                        }
                    );

                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        "Palavra-passe incorreta."
                    );
                }

                adminPassword =
                    password;

                sessionStorage.setItem(
                    "adminPassword",
                    password
                );

                loginPassword.value = "";

                loginStatus.textContent = "";

                mostrarPainel();

                carregarPromocoes();
                carregarMarcas();

            } catch (error) {

                console.error(error);

                loginStatus.textContent =
                    error.message;

            }

        }
    );

}


/* Sessão já existente */

if (adminPassword) {

    mostrarPainel();

} else {

    mostrarLogin();

}
/* =====================================
   INICIAR
===================================== */

if (adminPassword) {
    mostrarPainel();
    carregarPromocoes();
    carregarMarcas();
    carregarMarcasNoSelect();
} else {
    mostrarLogin();
}

/* =====================================
   ELEMENTOS
===================================== */

const offersContainer = document.querySelector("#offers");
const searchInput = document.querySelector("#search");
const emptyMessage = document.querySelector("#empty");
const categoryButtons = document.querySelectorAll(".category");
const menuButton = document.querySelector("#menuButton");
const mainMenu = document.querySelector("#mainMenu");


/* =====================================
   DADOS
===================================== */

let ofertas = [];
let categoriaAtual = "Todas";


/* =====================================
   CARREGAR OFERTAS DA API
===================================== */

async function carregarOfertas() {

    try {

        const response = await fetch("/api/ofertas");

        if (!response.ok) {
            throw new Error(
                `Erro ao carregar ofertas: ${response.status}`
            );
        }

        const data = await response.json();

        /*
         * A API devolve:
         *
         * {
         *   ofertas: [...]
         * }
         *
         * Por isso temos de usar data.ofertas.
         */

        ofertas = Array.isArray(data.ofertas)
            ? data.ofertas
            : [];


        console.log("Ofertas carregadas:", ofertas);


        mostrarOfertas();


    } catch (erro) {

        console.error(
            "Erro ao carregar ofertas:",
            erro
        );

        ofertas = [];

        if (offersContainer) {
            offersContainer.innerHTML = `
                <p>
                    Não foi possível carregar as promoções.
                </p>
            `;
        }

    }

}


/* =====================================
   MOSTRAR OFERTAS
===================================== */

function mostrarOfertas() {

    if (!offersContainer) {
        return;
    }


    const pesquisa =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    /*
     * Agora "ofertas" é sempre um ARRAY,
     * portanto .filter() funciona.
     */

    const filtradas = ofertas.filter(
        oferta => {

            const categoriaOK =
                categoriaAtual === "Todas" ||
                oferta.categoria === categoriaAtual;


            const texto =
                `${oferta.titulo || ""}
                 ${oferta.categoria || ""}`
                .toLowerCase();


            const pesquisaOK =
                texto.includes(pesquisa);


            return categoriaOK && pesquisaOK;

        }
    );


    offersContainer.innerHTML = "";


    /* =====================================
       NENHUMA OFERTA
    ===================================== */

    if (!filtradas.length) {

        if (emptyMessage) {
            emptyMessage.hidden = false;
        }

        return;

    }


    if (emptyMessage) {
        emptyMessage.hidden = true;
    }


    /* =====================================
       CRIAR CARTÕES
    ===================================== */

    filtradas.forEach(oferta => {

        const card =
            document.createElement("article");

        card.className = "offer-card";


        /* ---------- IMAGEM ---------- */

        let imagem;


        if (oferta.imagem) {

            imagem = `
                <img
                    src="${oferta.imagem}"
                    alt="${escapeHtml(oferta.titulo || "Oferta")}"
                    loading="lazy"
                >
            `;

        } else {

            imagem = `
                <div class="no-image">
                    Imagem da oferta
                </div>
            `;

        }


        /* ---------- CARTÃO ---------- */

        card.innerHTML = `
    <a
        class="offer-link"
        href="${escapeAttribute(oferta.link || "#")}"
        target="_blank"
        rel="nofollow sponsored noopener"
        aria-label="Ver oferta: ${escapeAttribute(oferta.titulo || "Oferta")}"
    >

        <div class="offer-image">

            ${imagem}

            <div class="offer-overlay">
                <span>Ver oferta</span>
                <strong>→</strong>
            </div>

        </div>

    </a>

    <div class="offer-info">

        <div class="offer-category">
            ${escapeHtml(oferta.categoria || "")}
        </div>

        <h3 class="offer-title">
            ${escapeHtml(oferta.titulo || "")}
        </h3>

    </div>
`;


        offersContainer.appendChild(card);

    });

}


/* =====================================
   CATEGORIAS
===================================== */

categoryButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            categoriaAtual =
                button.dataset.category;


            categoryButtons.forEach(
                item => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add(
                "active"
            );


            mostrarOfertas();

        }
    );

});


/* =====================================
   PESQUISA
===================================== */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        mostrarOfertas
    );

}


/* =====================================
   MENU MOBILE
===================================== */

if (menuButton && mainMenu) {

    menuButton.addEventListener(
        "click",
        () => {

            mainMenu.classList.toggle(
                "open"
            );

        }
    );

}


/* =====================================
   LINKS DO MENU PRINCIPAL
===================================== */

document
    .querySelectorAll(
        ".main-menu a[data-category]"
    )
    .forEach(link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();


                categoriaAtual =
                    link.dataset.category;


                categoryButtons.forEach(
                    button => {

                        button.classList.toggle(
                            "active",
                            button.dataset.category ===
                            categoriaAtual
                        );

                    }
                );


                mostrarOfertas();


                if (mainMenu) {

                    mainMenu.classList.remove(
                        "open"
                    );

                }


                const ofertasSection =
                    document.querySelector(
                        "#ofertas"
                    );


                if (ofertasSection) {

                    ofertasSection.scrollIntoView({
                        behavior: "smooth"
                    });

                }

            }
        );

    });


/* =====================================
   PROTEÇÃO HTML
===================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
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


function escapeAttribute(value) {

    return String(value ?? "")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}


/* =====================================
   INICIAR SITE
===================================== */

/*
 * IMPORTANTE:
 *
 * Não fazemos:
 *
 *     mostrarOfertas();
 *
 * antes de carregar os dados.
 *
 * Primeiro vamos buscar as promoções
 * à D1 através de /api/ofertas.
 */

carregarOfertas();

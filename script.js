const offersContainer =
    document.querySelector("#offers");

const searchInput =
    document.querySelector("#search");

const emptyMessage =
    document.querySelector("#empty");

const categoryButtons =
    document.querySelectorAll(".category");

const menuButton =
    document.querySelector("#menuButton");

const mainMenu =
    document.querySelector("#mainMenu");


let categoriaAtual = "Todas";

let ofertas = [];


async function carregarOfertas() {
    try {
        const resposta = await fetch("/api/ofertas");

        if (!resposta.ok) {
            throw new Error("Erro ao carregar promoções");
        }

        const dados = await resposta.json();

        ofertas = dados.ofertas || [];

        mostrarOfertas();

    } catch (erro) {

        console.error("Erro ao carregar ofertas:", erro);

        ofertas = [];

        mostrarOfertas();
    }
}


/* =====================================
   MOSTRAR OFERTAS
===================================== */



function mostrarOfertas() {

    const pesquisa =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const filtradas = ofertas.filter(
        oferta => {

            const categoriaOK =
                categoriaAtual === "Todas" ||
                oferta.categoria === categoriaAtual;


            const texto =
                `${oferta.titulo}
                 ${oferta.categoria}`
                .toLowerCase();


            const pesquisaOK =
                texto.includes(pesquisa);


            return categoriaOK &&
                   pesquisaOK;

        }
    );


    offersContainer.innerHTML = "";


    filtradas.forEach(oferta => {

        const card =
            document.createElement("article");

        card.className =
            "offer-card";


        let imagem;


        if (oferta.imagem) {

            imagem = `
                <img
                    src="${oferta.imagem}"
                    alt="${oferta.titulo}"
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


        card.innerHTML = `

            <a
                class="offer-link"
                href="${oferta.link}"
                target="_blank"
                rel="nofollow sponsored noopener"
            >

                <div class="offer-image">

                    ${imagem}

                </div>

            </a>


            <div class="offer-info">

                <div class="offer-category">

                    ${oferta.categoria}

                </div>

                <h3 class="offer-title">

                    ${oferta.titulo}

                </h3>

            </div>

        `;


        offersContainer.appendChild(card);

    });


    emptyMessage.hidden =
        filtradas.length !== 0;

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

menuButton.addEventListener(
    "click",
    () => {

        mainMenu.classList.toggle(
            "open"
        );

    }
);


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


                mainMenu.classList.remove(
                    "open"
                );


                document
                    .querySelector("#ofertas")
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    });


/* =====================================
   INICIAR
===================================== */

carregarOfertas();

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


/*
    Nesta primeira versão usamos
    localStorage.

    Mais tarde substituímos isto
    pela base de dados Cloudflare D1.
*/


let promocoes =
    JSON.parse(
        localStorage.getItem("cenastop_promocoes")
    ) || [];


/* =========================
   DATA
========================= */

const dateInput =
    document.querySelector("#date");

const hoje =
    new Date().toISOString().split("T")[0];

dateInput.value = hoje;


/* =========================
   PREVISUALIZAÇÃO
========================= */

imageInput.addEventListener(
    "change",
    function () {

        const ficheiro =
            this.files[0];

        if (!ficheiro) {

            preview.innerHTML = "";

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                preview.innerHTML = `

                    <img
                        src="${event.target.result}"
                        alt="Pré-visualização">

                `;

            };


        reader.readAsDataURL(ficheiro);

    }
);


/* =========================
   GUARDAR
========================= */

form.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const title =
            document.querySelector("#title").value;

        const category =
            document.querySelector("#category").value;

        const link =
            document.querySelector("#link").value;

        const date =
            document.querySelector("#date").value;

        const file =
            imageInput.files[0];


        if (!file) {

            alert("Escolha uma imagem.");

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                const promocao = {

                    id: Date.now(),

                    titulo: title,

                    categoria: category,

                    link: link,

                    data: date,

                    imagem: event.target.result

                };


                promocoes.unshift(
                    promocao
                );


                guardar();

                mostrarPromocoes();

                form.reset();

                dateInput.value = hoje;

                preview.innerHTML = "";

            };


        reader.readAsDataURL(file);

    }
);


/* =========================
   GUARDAR LOCALMENTE
========================= */

function guardar() {

    localStorage.setItem(
        "cenastop_promocoes",
        JSON.stringify(promocoes)
    );

}


/* =========================
   MOSTRAR
========================= */

function mostrarPromocoes() {

    offerList.innerHTML = "";


    offerCount.textContent =
        `${promocoes.length} promoção` +
        (promocoes.length === 1
            ? ""
            : "ões");


    promocoes.forEach(
        promocao => {

            const item =
                document.createElement("div");

            item.className =
                "offer-item";


            item.innerHTML = `

                <img
                    src="${promocao.imagem}"
                    alt="${promocao.titulo}">


                <div>

                    <h3>
                        ${promocao.titulo}
                    </h3>

                    <p>
                        ${promocao.categoria}
                        ·
                        ${promocao.data}
                    </p>

                </div>


                <button
                    class="delete-button"
                    data-id="${promocao.id}">

                    Apagar

                </button>

            `;


            offerList.appendChild(item);

        }
    );


    document
        .querySelectorAll(".delete-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const id =
                        Number(
                            this.dataset.id
                        );


                    promocoes =
                        promocoes.filter(
                            promocao =>
                                promocao.id !== id
                        );


                    guardar();

                    mostrarPromocoes();

                }
            );

        });

}


/* =========================
   APAGAR TUDO
========================= */

clearAll.addEventListener(
    "click",
    function () {

        if (!promocoes.length) {
            return;
        }


        const confirmar =
            confirm(
                "Tem a certeza que quer apagar todas as promoções?"
            );


        if (!confirmar) {
            return;
        }


        promocoes = [];

        guardar();

        mostrarPromocoes();

    }
);


/* =========================
   INICIAR
========================= */

mostrarPromocoes();
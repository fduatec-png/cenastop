const form = document.querySelector("#offerForm");
const imageInput = document.querySelector("#image");
const preview = document.querySelector("#preview");
const offerList = document.querySelector("#offerList");
const offerCount = document.querySelector("#offerCount");
const clearAll = document.querySelector("#clearAll");
const dateInput = document.querySelector("#date");
const passwordInput = document.querySelector("#password");
const statusBox = document.querySelector("#status");

let modoEdicao = false;
let idEdicao = null;
let imagemAtual = "";

const hoje = new Date().toISOString().split("T")[0];
dateInput.value = hoje;


/* =====================================
   STATUS
===================================== */

function status(message, error = false) {
  statusBox.textContent = message;
  statusBox.style.color = error ? "#b00020" : "";
}


/* =====================================
   PRÉ-VISUALIZAÇÃO DA IMAGEM
===================================== */

imageInput.addEventListener("change", function () {
  const file = this.files[0];

  preview.innerHTML = "";

  if (!file) return;

  const reader = new FileReader();

  reader.onload = event => {
    preview.innerHTML = `
      <img
        src="${event.target.result}"
        alt="Pré-visualização"
      >
    `;
  };

  reader.readAsDataURL(file);
});


/* =====================================
   API
===================================== */

async function api(path, options = {}) {
  const password = passwordInput.value;

  const headers = new Headers(
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

  const response = await fetch(
    path,
    {
      ...options,
      headers
    }
  );

  const data =
    await response
      .json()
      .catch(() => ({}));

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

    const response = await fetch(
      `/api/ofertas?t=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    const data =
      await response.json();

    mostrarPromocoes(
      data.ofertas || []
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
   SUBMETER FORMULÁRIO
===================================== */

form.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    const title =
      document
        .querySelector("#title")
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


    if (!modoEdicao && !file) {
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

      let imagem = imagemAtual;


      /*
       * Se foi escolhida uma nova imagem,
       * comprimi-la.
       */

      if (file) {

        status(
          "A preparar a imagem..."
        );

        imagem =
          await comprimirImagem(file);

      }


      /*
       * ADICIONAR
       */

      if (!modoEdicao) {

        status(
          "A guardar promoção..."
        );

        await api(
          "/api/ofertas",
          {
            method: "POST",

            body: JSON.stringify({
              titulo: title,
              categoria: category,
              link,
              data: date,
              imagem
            })
          }
        );


        status(
          "Promoção adicionada com sucesso."
        );

      }


      /*
       * EDITAR
       */

      else {

        status(
          "A atualizar promoção..."
        );

        await api(
          `/api/ofertas?id=${encodeURIComponent(idEdicao)}`,
          {
            method: "PUT",

            body: JSON.stringify({
              titulo: title,
              categoria: category,
              link,
              data: date,
              imagem
            })
          }
        );


        status(
          "Promoção atualizada com sucesso."
        );

      }


      /*
       * Limpar formulário
       */

      cancelarEdicao();

      await carregarPromocoes();


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

async function comprimirImagem(file) {

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

        reader.readAsDataURL(file);

      }
    );


  const img =
    await new Promise(
      (resolve, reject) => {

        const image =
          new Image();

        image.onload =
          () => resolve(image);

        image.onerror =
          reject;

        image.src = dataUrl;

      }
    );


  const max = 1200;

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
    canvas.getContext("2d");


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
   MOSTRAR PROMOÇÕES
===================================== */

function mostrarPromocoes(promocoes) {

  offerList.innerHTML = "";

  offerCount.textContent =
    `${promocoes.length} promoção` +
    (
      promocoes.length === 1
        ? ""
        : "ões"
    );


  if (!promocoes.length) {

    offerList.innerHTML =
      "<p>Nenhuma promoção encontrada.</p>";

    return;

  }


  promocoes.forEach(
    promocao => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "offer-item";


      item.innerHTML = `
        <img
          src="${escapeAttribute(
            promocao.imagem || ""
          )}"
          alt=""
        >

        <div class="offer-item-info">

          <h3>
            ${escapeHtml(
              promocao.titulo
            )}
          </h3>

          <p>
            ${escapeHtml(
              promocao.categoria
            )}
            ·
            ${escapeHtml(
              promocao.data
            )}
          </p>

        </div>

        <div class="offer-actions">

          <button
            class="edit-button"
            data-id="${escapeAttribute(
              promocao.id
            )}"
          >
            Editar
          </button>

          <button
            class="delete-button"
            data-id="${escapeAttribute(
              promocao.id
            )}"
          >
            Apagar
          </button>

        </div>
      `;


      offerList.appendChild(
        item
      );

    }
  );


  /*
   * BOTÕES EDITAR
   */

  offerList
    .querySelectorAll(
      ".edit-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const promocao =
            promocoes.find(
              item =>
                String(item.id) ===
                String(button.dataset.id)
            );


          if (promocao) {
            iniciarEdicao(
              promocao
            );
          }

        }
      );

    });


  /*
   * BOTÕES APAGAR
   */

  offerList
    .querySelectorAll(
      ".delete-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          if (
            !confirm(
              "Apagar esta promoção?"
            )
          ) {
            return;
          }


          try {

            await api(
              `/api/ofertas?id=${encodeURIComponent(
                button.dataset.id
              )}`,
              {
                method: "DELETE"
              }
            );


            await carregarPromocoes();


            status(
              "Promoção apagada."
            );


          } catch (e) {

            status(
              e.message,
              true
            );

          }

        }
      );

    });

}


/* =====================================
   INICIAR EDIÇÃO
===================================== */

function iniciarEdicao(promocao) {

  modoEdicao = true;

  idEdicao =
    promocao.id;

  imagemAtual =
    promocao.imagem || "";


  document
    .querySelector("#title")
    .value =
      promocao.titulo || "";


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


  imageInput.value = "";


  if (imagemAtual) {

    preview.innerHTML = `
      <p>Imagem atual:</p>

      <img
        src="${imagemAtual}"
        alt="Imagem atual"
      >
    `;

  } else {

    preview.innerHTML = "";

  }


  status(
    "A editar promoção. Faça as alterações e grave."
  );
mostrarBotaoCancelar();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =====================================
   CANCELAR EDIÇÃO
===================================== */

function cancelarEdicao() {

  modoEdicao = false;

  idEdicao = null;

  imagemAtual = "";


  form.reset();


  dateInput.value =
    new Date()
      .toISOString()
      .split("T")[0];


  preview.innerHTML = "";


  /*
   * Se o botão cancelar existir
   */

  const cancelButton =
    document.querySelector(
      "#cancelEdit"
    );


  if (cancelButton) {

    cancelButton.remove();

  }

}


/* =====================================
   BOTÃO CANCELAR EDIÇÃO
===================================== */

function mostrarBotaoCancelar() {

  if (
    document.querySelector(
      "#cancelEdit"
    )
  ) {
    return;
  }


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";

  button.id =
    "cancelEdit";

  button.className =
    "cancel-button";

  button.textContent =
    "Cancelar edição";


  button.addEventListener(
    "click",
    () => {

      cancelarEdicao();

      status(
        "Edição cancelada."
      );

    }
  );


  form.appendChild(
    button
  );

}


/*
 * Quando entramos em edição,
 * criar botão cancelar.
 */

const observer =
  new MutationObserver(
    () => {}
  );


/* =====================================
   LIMPAR TODAS
===================================== */

clearAll.addEventListener(
  "click",
  async () => {

    if (
      !confirm(
        "Tem a certeza que quer apagar todas as promoções?"
      )
    ) {
      return;
    }


    try {

      await api(
        "/api/ofertas",
        {
          method: "DELETE"
        }
      );


      await carregarPromocoes();


      status(
        "Todas as promoções foram apagadas."
      );


    } catch (e) {

      status(
        e.message,
        true
      );

    }

  }
);


/* =====================================
   PROTEÇÃO HTML
===================================== */

function escapeHtml(value) {

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


function escapeAttribute(value) {

  return String(
    value ?? ""
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

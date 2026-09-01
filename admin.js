const form = document.querySelector("#offerForm");
const imageInput = document.querySelector("#image");
const preview = document.querySelector("#preview");
const offerList = document.querySelector("#offerList");
const offerCount = document.querySelector("#offerCount");
const clearAll = document.querySelector("#clearAll");
const dateInput = document.querySelector("#date");
const passwordInput = document.querySelector("#password");
const statusBox = document.querySelector("#status");

let editarId = null;

const hoje = new Date().toISOString().split("T")[0];

if (dateInput) {
  dateInput.value = hoje;
}


/* =====================================
   STATUS
===================================== */

function status(message, error = false) {
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.style.color = error ? "#b00020" : "";
}


/* =====================================
   PREVISUALIZAÇÃO DA IMAGEM
===================================== */

if (imageInput) {
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
}


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

    status("A carregar promoções...");

    const response =
      await fetch(
        "/api/ofertas",
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
      Array.isArray(data.ofertas)
        ? data.ofertas
        : [];

    mostrarPromocoes(promocoes);

    status("");

  } catch (e) {

    console.error(e);

    status(
      "Não foi possível carregar as promoções.",
      true
    );

  }

}


/* =====================================
   ADICIONAR / EDITAR
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
        "Introduza um título.",
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
        "Introduza o link da promoção.",
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


    if (!passwordInput.value) {

      status(
        "Introduza a palavra-passe de administração.",
        true
      );

      return;

    }


    try {

      let imagem = "";


      /*
       * Se estamos a editar e não foi escolhida
       * uma nova imagem, mantemos a imagem antiga.
       */

      if (file) {

        status(
          "A preparar a imagem..."
        );

        imagem =
          await comprimirImagem(file);

      }


      /* =================================
         EDITAR
      ================================= */

      if (editarId) {

        status(
          "A atualizar promoção..."
        );

        await api(
          `/api/ofertas?id=${encodeURIComponent(editarId)}`,
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


      /* =================================
         NOVA PROMOÇÃO
      ================================= */

      else {

        if (!file) {

          status(
            "Escolha uma imagem.",
            true
          );

          return;

        }

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
          src="${promocao.imagem || ""}"
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
            type="button"
            class="edit-button"
            data-id="${promocao.id}"
          >
            Editar
          </button>

          <button
            type="button"
            class="delete-button"
            data-id="${promocao.id}"
          >
            Apagar
          </button>

        </div>

      `;


      offerList.appendChild(item);


      /* ================================
         EDITAR
      ================================= */

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


      /* ================================
         APAGAR
      ================================= */

      const deleteButton =
        item.querySelector(
          ".delete-button"
        );


      deleteButton.addEventListener(
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
                deleteButton.dataset.id
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

    }
  );

}


/* =====================================
   INICIAR EDIÇÃO
===================================== */

function iniciarEdicao(promocao) {

  editarId =
    promocao.id;


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


  /*
   * Durante edição a imagem deixa de ser obrigatória.
   */

  imageInput.required = false;


  /*
   * Mostrar imagem atual.
   */

  preview.innerHTML = "";

  if (promocao.imagem) {

    preview.innerHTML = `

      <div style="margin-bottom:10px;">
        <small>Imagem atual:</small>
      </div>

      <img
        src="${promocao.imagem}"
        alt="Imagem atual"
        style="max-width:300px;"
      >

      <p>
        <small>
          Escolha uma nova imagem apenas
          se quiser substituí-la.
        </small>
      </p>

    `;

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


    saveButton.parentNode.insertBefore(
      cancelButton,
      saveButton
    );


    cancelButton.addEventListener(
      "click",
      cancelarEdicao
    );

  }


  cancelButton.style.display =
    "block";


  status(
    "A editar: " +
    promocao.titulo
  );


  form.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* =====================================
   CANCELAR EDIÇÃO
===================================== */

function cancelarEdicao() {

  editarId = null;

  form.reset();

  dateInput.value = hoje;

  imageInput.required = true;

  preview.innerHTML = "";


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
   SEGURANÇA HTML
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


/* =====================================
   INICIAR
===================================== */

carregarPromocoes();

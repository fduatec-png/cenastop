const form = document.querySelector("#offerForm");
const imageInput = document.querySelector("#image");
const preview = document.querySelector("#preview");
const offerList = document.querySelector("#offerList");
const offerCount = document.querySelector("#offerCount");
const clearAll = document.querySelector("#clearAll");
const dateInput = document.querySelector("#date");
const passwordInput = document.querySelector("#password");
const statusBox = document.querySelector("#status");

const hoje = new Date().toISOString().split("T")[0];
dateInput.value = hoje;

function status(message, error = false) {
  statusBox.textContent = message;
  statusBox.style.color = error ? "#b00020" : "";
}

imageInput.addEventListener("change", function () {
  const file = this.files[0];
  preview.innerHTML = "";
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    preview.innerHTML = `<img src="${event.target.result}" alt="Pré-visualização">`;
  };
  reader.readAsDataURL(file);
});

async function api(path, options = {}) {
  const password = passwordInput.value;
  const headers = new Headers(options.headers || {});
  headers.set("X-Admin-Password", password);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {...options, headers});
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Erro ${response.status}`);
  }
  return data;
}

async function carregarPromocoes() {
  try {
    const data = await fetch("/api/ofertas").then(r => r.json());
    mostrarPromocoes(data.ofertas || []);
  } catch (e) {
    status("Não foi possível carregar as promoções.", true);
  }
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const title = document.querySelector("#title").value.trim();
  const category = document.querySelector("#category").value;
  const link = document.querySelector("#link").value.trim();
  const date = dateInput.value;
  const file = imageInput.files[0];

  if (!file) {
    status("Escolha uma imagem.", true);
    return;
  }

  if (!passwordInput.value) {
    status("Introduza a palavra-passe de administração.", true);
    return;
  }

  try {
    status("A preparar a imagem...");

    const imagem = await comprimirImagem(file);

    status("A guardar promoção...");

    await api("/api/ofertas", {
      method: "POST",
      body: JSON.stringify({
        titulo: title,
        categoria: category,
        link,
        data: date,
        imagem
      })
    });

    status("Promoção adicionada com sucesso.");
    form.reset();
    dateInput.value = date;
    preview.innerHTML = "";
    await carregarPromocoes();
  } catch (e) {
    status(e.message, true);
  }
});

async function comprimirImagem(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const max = 1200;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/webp", 0.78);
}

function mostrarPromocoes(promocoes) {
  offerList.innerHTML = "";
  offerCount.textContent =
    `${promocoes.length} promoção` + (promocoes.length === 1 ? "" : "ões");

  if (!promocoes.length) {
    offerList.innerHTML = "<p>Nenhuma promoção encontrada.</p>";
    return;
  }

  promocoes.forEach(promocao => {
    const item = document.createElement("div");
    item.className = "offer-item";

    item.innerHTML = `
      <img src="${promocao.imagem || ""}" alt="">
      <div>
        <h3>${escapeHtml(promocao.titulo)}</h3>
        <p>${escapeHtml(promocao.categoria)} · ${escapeHtml(promocao.data)}</p>
      </div>
      <button class="delete-button" data-id="${promocao.id}">Apagar</button>
    `;

    offerList.appendChild(item);
  });

  offerList.querySelectorAll(".delete-button").forEach(button => {
    button.addEventListener("click", async () => {
      if (!confirm("Apagar esta promoção?")) return;

      try {
        await api(`/api/ofertas?id=${encodeURIComponent(button.dataset.id)}`, {
          method: "DELETE"
        });
        await carregarPromocoes();
        status("Promoção apagada.");
      } catch (e) {
        status(e.message, true);
      }
    });
  });
}

clearAll.addEventListener("click", async () => {
  if (!confirm("Tem a certeza que quer apagar todas as promoções?")) return;

  try {
    await api("/api/ofertas", {method: "DELETE"});
    await carregarPromocoes();
    status("Todas as promoções foram apagadas.");
  } catch (e) {
    status(e.message, true);
  }
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

carregarPromocoes();

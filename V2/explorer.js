// Charger les fichiers depuis le JSON
let fileData = {};
let currentPath = [];

async function loadFiles() {
  const res = await fetch("explorer.json");
  fileData = await res.json();
  renderTree(document.getElementById("tree"), fileData, []);
  openFolder([]);
}

// --- Arborescence (sidebar) ---
function renderTree(container, node, path) {
  container.innerHTML = "";
  node.children.forEach(child => {
    const item = document.createElement("div");
    item.className = "explorer__tree-item";
    item.innerHTML = child.type === "folder" ? "📁 " + child.name : "📄 " + child.name;

    item.onclick = () => {
      if (child.type === "folder") {
        openFolder(path.concat(child.name));
      } else {
        openFile(child);
      }
    };

    container.appendChild(item);

    if (child.type === "folder") {
      const sub = document.createElement("div");
      sub.className = "explorer__tree-children";
      renderTree(sub, child, path.concat(child.name));
      container.appendChild(sub);
    }
  });
}

// --- Contenu principal (grid) ---
function openFolder(path) {
  currentPath = path;
  const node = getNode(path);
  renderBreadcrumb();
  renderGrid(node);
}

function getNode(path) {
  let node = fileData;
  for (const part of path) {
    node = node.children.find(c => c.name === part && c.type === "folder");
  }
  return node;
}

function renderGrid(node) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  if (!node || !node.children || node.children.length === 0) {
    grid.innerHTML = `<div class="explorer__empty">📂 Dossier vide</div>`;
    return;
  }

  node.children.forEach(child => {
    const tile = document.createElement("div");
    tile.className = "explorer__tile";
    tile.innerHTML = `
      <div class="icon">${child.type === "folder" ? "📁" : "📄"}</div>
      <div class="name">${child.name}</div>
      <div class="meta">${child.type}</div>
    `;

    tile.onclick = () => {
      if (child.type === "folder") {
        openFolder(currentPath.concat(child.name));
      } else {
        openFile(child);
      }
    };

    grid.appendChild(tile);
  });
}

// --- Fil d'Ariane (breadcrumb) ---
function renderBreadcrumb() {
  const breadcrumb = document.getElementById("breadcrumb");
  breadcrumb.innerHTML = "";
  let path = [];
  const root = document.createElement("span");
  root.textContent = "🏠 Racine";
  root.style.cursor = "pointer";
  root.onclick = () => openFolder([]);
  breadcrumb.appendChild(root);

  currentPath.forEach((part, i) => {
    const span = document.createElement("span");
    span.textContent = "› " + part;
    span.style.cursor = "pointer";
    span.onclick = () => openFolder(currentPath.slice(0, i + 1));
    breadcrumb.appendChild(span);
  });
}

// --- Ouvrir un fichier ---
function openFile(file) {
  if (file.open === "iframe") {
    const grid = document.getElementById("grid");
    grid.innerHTML = `<iframe src="${file.url}" style="width:100%;height:500px;border:none;border-radius:12px;"></iframe>`;
  } else {
    window.open(file.url, "_blank");
  }
}

loadFiles();


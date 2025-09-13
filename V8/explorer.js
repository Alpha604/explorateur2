let fileData = {};
let currentPath = [];
let activeFile = null;

// Charger le JSON
async function loadFiles() {
  const res = await fetch("files.json");
  fileData = await res.json();
  renderTree(document.getElementById("tree"), fileData, []);
  openFolder([]); // affiche la racine
}

// --- Arborescence (sidebar) ---
function renderTree(container, node, path) {
  container.innerHTML = "";
  node.children.forEach(child => {
    const item = document.createElement("div");
    item.className = "explorer__tree-item";

    if (child.type === "folder") {
      item.innerHTML = `📁 ${child.name}`;
      item.onclick = (e) => {
        e.stopPropagation();
        const sub = item.nextSibling;
        sub.style.display = (sub.style.display === "none") ? "block" : "none";
        openFolder(path.concat(child.name));
      };

      container.appendChild(item);

      const sub = document.createElement("div");
      sub.className = "explorer__tree-children";
      sub.style.display = "none"; // fermé par défaut
      renderTree(sub, child, path.concat(child.name));
      container.appendChild(sub);

    } else {
      item.innerHTML = `📄 ${child.name}`;
      if (activeFile && activeFile.name === child.name) {
        item.classList.add("active"); // surbrillance
      }
      item.onclick = (e) => {
        e.stopPropagation();
        openFile(child, path);
      };
      container.appendChild(item);
    }
  });
}

// --- Contenu principal ---
function openFolder(path) {
  currentPath = path;
  const node = getNode(path);
  renderBreadcrumb();
  renderGrid(node);
}

function getNode(path) {
  let node = { children: fileData };
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

    if (child.type === "folder") {
      tile.innerHTML = `
        <div class="icon">📁</div>
        <div class="name">${child.name}</div>
        <div class="meta">Dossier</div>
      `;
      tile.onclick = () => openFolder(currentPath.concat(child.name));
    } else {
      tile.innerHTML = `
        <div class="icon">📄</div>
        <div class="name">${child.name}</div>
        <div class="meta">Fichier</div>
      `;
      tile.onclick = () => openFile(child, currentPath);
    }
    grid.appendChild(tile);
  });
}

// --- Fil d'Ariane ---
function renderBreadcrumb() {
  const breadcrumb = document.getElementById("breadcrumb");
  breadcrumb.innerHTML = "";
  const root = document.createElement("span");
  root.textContent = "🏠 Racine";
  root.style.cursor = "pointer";
  root.onclick = () => openFolder([]);
  breadcrumb.appendChild(root);

  currentPath.forEach((part, i) => {
    const span = document.createElement("span");
    span.textContent = " › " + part;
    span.style.cursor = "pointer";
    span.onclick = () => openFolder(currentPath.slice(0, i + 1));
    breadcrumb.appendChild(span);
  });
}

// --- Popup pour ouvrir fichier ---
function openFile(file, filePath) {
  activeFile = file;

  // Déplier automatiquement la sidebar jusqu'au fichier
  expandToFile(filePath, file.name);

  const popup = document.getElementById("popup");
  const popupBody = document.getElementById("popupBody");

  popupBody.innerHTML = `
    <div class="popup-header">
      <span class="popup-title">${file.name}</span>
      <button class="popup-close" id="popupClose">✖</button>
    </div>
    <iframe id="${file.name}" src="${file.url}" allowtransparency="true"></iframe>
  `;

  document.getElementById("popupClose").onclick = () => {
    popup.style.display = "none";
    popupBody.innerHTML = "";
    activeFile = null;
    renderTree(document.getElementById("tree"), { children: fileData }, []);
  };

  popup.style.display = "flex";

  // Affiche également le fichier dans le centre
  renderGridFile(file);
}

// --- Affiche le fichier dans le centre ---
function renderGridFile(file) {
  const grid = document.getElementById("grid");
  grid.innerHTML = `<div class="explorer__tile">
    <div class="icon">📄</div>
    <div class="name">${file.name}</div>
    <div class="meta">Fichier ouvert</div>
  </div>`;
}

// Déplier la sidebar jusqu’au fichier actif
function expandToFile(path, fileName) {
  const tree = document.getElementById("tree");
  renderTree(tree, { children: fileData }, []);

  let node = { children: fileData };
  let container = tree;
  path.forEach(part => {
    let folderNode = node.children.find(c => c.name === part && c.type === "folder");
    if (folderNode) {
      const allItems = container.querySelectorAll(".explorer__tree-item");
      allItems.forEach((item, idx) => {
        if (item.textContent.includes(part)) {
          const sub = item.nextSibling;
          if (sub && sub.classList.contains("explorer__tree-children")) {
            sub.style.display = "block"; // ouvre le dossier
            container = sub;
          }
        }
      });
      node = folderNode;
    }
  });

  // Mettre en surbrillance le fichier
  const allFiles = tree.querySelectorAll(".file, .explorer__tree-item");
  allFiles.forEach(f => f.classList.remove("active"));
  const active = Array.from(tree.querySelectorAll(".explorer__tree-item"))
    .find(f => f.textContent.includes(fileName));
  if (active) active.classList.add("active");
}

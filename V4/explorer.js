let fileData = {};
let currentPath = [];

// Charger le JSON
async function loadFiles() {
  const res = await fetch("files.json");
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

    if (child.type === "folder") {
      item.innerHTML = `📁 ${child.name}`;
      item.onclick = (e) => {
        e.stopPropagation();
        const sub = item.nextSibling;
        sub.style.display = sub.style.display === "none" ? "block" : "none";
      };

      container.appendChild(item);

      const sub = document.createElement("div");
      sub.className = "explorer__tree-children";
      renderTree(sub, child, path.concat(child.name));
      container.appendChild(sub);

    } else {
      item.innerHTML = `📄 ${child.name}`;
      item.onclick = (e) => {
        e.stopPropagation();
        openFile(child);
      };
      container.appendChild(item);
    }
  });
}

// --- Contenu principal (juste dossiers, pas fichiers) ---
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
    if (child.type === "folder") {
      const tile = document.createElement("div");
      tile.className = "explorer__tile";
      tile.innerHTML = `
        <div class="icon">📁</div>
        <div class="name">${child.name}</div>
        <div class="meta">Dossier</div>
      `;
      tile.onclick = () => openFolder(currentPath.concat(child.name));
      grid.appendChild(tile);
    }
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
    span.textContent = "› " + part;
    span.style.cursor = "pointer";
    span.onclick = () => openFolder(currentPath.slice(0, i + 1));
    breadcrumb.appendChild(span);
  });
}

// --- Popup pour ouvrir fichier ---
function openFile(file) {
  const popup = document.getElementById("popup");
  const popupBody = document.getElementById("popupBody");

  popupBody.innerHTML = `
    <iframe id="${file.name}" allowtransparency="true" frameborder="0"
      style="width:100%;border:none;" src="${file.url}"></iframe>
    <script nonce="chesscom-diagram">
      window.addEventListener("message",e=>{
        e['data']&&"${file.name}"===e['data']['id']&&
        document.getElementById(\`\${e['data']['id']}\`)&&
        (document.getElementById(\`\${e['data']['id']}\`).style.height=\`\${e['data']['frameHeight']+37}px\`)
      });
    <\/script>
  `;

  popup.style.display = "flex";
}

document.getElementById("popupClose").onclick = () => {
  document.getElementById("popup").style.display = "none";
  document.getElementById("popupBody").innerHTML = "";
};

loadFiles();

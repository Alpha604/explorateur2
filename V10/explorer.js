let fileData = [];
let currentPath = [];
let activeFile = null;

async function loadFiles() {
  const res = await fetch("files.json");
  fileData = await res.json();
  renderTree(document.getElementById("tree"), fileData, []);
  openFolder([]); // racine
}

function renderTree(container, node, path) {
  container.innerHTML = "";
  node.forEach(child => {
    const item = document.createElement("div");
    item.className = "explorer__tree-item";

    if (child.type === "folder") {
      item.textContent = "📁 " + child.name;
      item.onclick = e => {
        e.stopPropagation();
        const sub = item.nextSibling;
        sub.style.display = (sub.style.display === "none") ? "block" : "none";
        openFolder(path.concat(child.name));
      };
      container.appendChild(item);

      const sub = document.createElement("div");
      sub.className = "explorer__tree-children";
      sub.style.display = "none";
      renderTree(sub, child.children, path.concat(child.name));
      container.appendChild(sub);

    } else {
      item.textContent = "📄 " + child.name;
      if (activeFile && activeFile.name === child.name) item.classList.add("active");
      item.onclick = e => {
        e.stopPropagation();
        openFile(child, path);
      };
      container.appendChild(item);
    }
  });
}

function openFolder(path) {
  currentPath = path;
  const node = getNode(path, fileData);
  renderBreadcrumb();
  renderGrid(node ? node.children : []);
}

function getNode(path, node) {
  let n = { children: node };
  for (const part of path) {
    n = n.children.find(c => c.name === part && c.type === "folder");
  }
  return n;
}

function renderGrid(children) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  if (!children || children.length === 0) {
    grid.innerHTML = "<div class='explorer__tile'>📂 Dossier vide</div>";
    return;
  }

  children.forEach(c => {
    const tile = document.createElement("div");
    tile.className = "explorer__tile";
    tile.textContent = (c.type === "folder" ? "📁 " : "📄 ") + c.name;
    tile.onclick = () => {
      if (c.type === "folder") {
        openFolder(currentPath.concat(c.name));
      } else {
        openFile(c, currentPath);
      }
    };
    grid.appendChild(tile);
  });
}

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

function openFile(file, path) {
  activeFile = file;

  // 1️⃣ Mettre à jour la sidebar
  expandToFile(path, file.name);

  // 2️⃣ Afficher popup
  const popup = document.getElementById("popup");
  const popupBody = document.getElementById("popupBody");
  popupBody.innerHTML = `
    <div class="popup-header">
      <span class="popup-title">${file.name}</span>
      <button class="popup-close" id="popupClose">✖</button>
    </div>
    <iframe src="${file.url}" allowtransparency="true"></iframe>
  `;
  document.getElementById("popupClose").onclick = () => popup.style.display = "none";
  popup.style.display = "flex";

  // 3️⃣ Afficher fichier dans le centre (grid)
  renderGrid([file]);
}

function expandToFile(path, fileName) {
  const tree = document.getElementById("tree");
  renderTree(tree, fileData, []);

  let node = fileData;
  let container = tree;
  path.forEach(part => {
    const folderNode = node.find(c => c.name === part && c.type === "folder");
    if (folderNode) {
      const items = container.querySelectorAll(".explorer__tree-item");
      items.forEach((item, idx) => {
        if (item.textContent.includes(part)) {
          const sub = item.nextSibling;
          if (sub && sub.classList.contains("explorer__tree-children")) sub.style.display = "block";
          container = sub;
        }
      });
      node = folderNode.children;
    }
  });

  // Ajouter active sur le fichier
  const allItems = tree.querySelectorAll(".explorer__tree-item");
  allItems.forEach(item => {
    if (item.textContent.includes(fileName)) item.classList.add("active");
  });
}

window.onload = loadFiles;

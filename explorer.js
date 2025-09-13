function initExplorer(containerId, jsonUrl = "explorer.json") {
  const container = document.getElementById(containerId);
  if (!container) return console.error("initExplorer: container introuvable");

  container.innerHTML = `
    <div class="explorer__wrap">
      <aside class="explorer__sidebar">
        <div class="explorer__brand">
          <div class="logo">FE</div>
          <div>
            <div class="title">Explorateur</div>
            <div class="subtitle">JSON · distant</div>
          </div>
        </div>
        <div class="explorer__tree" id="${containerId}-tree"></div>
      </aside>

      <main class="explorer__main">
        <div class="explorer__breadcrumb" id="${containerId}-breadcrumb"></div>
        <div class="explorer__grid" id="${containerId}-grid"></div>
        <div class="explorer__empty" id="${containerId}-empty" style="display:none">Aucun élément</div>
        <div class="explorer__preview" id="${containerId}-preview"></div>
      </main>
    </div>
  `;

  const treeEl = container.querySelector(`#${containerId}-tree`);
  const gridEl = container.querySelector(`#${containerId}-grid`);
  const breadcrumbEl = container.querySelector(`#${containerId}-breadcrumb`);
  const emptyEl = container.querySelector(`#${containerId}-empty`);
  const previewEl = container.querySelector(`#${containerId}-preview`);

  let fsTree = null;
  let currentPath = [];
  const expanded = new Set();

  /* -------------------
     Charger JSON externe
     ------------------- */
  fetch(jsonUrl)
    .then(r => r.json())
    .then(data => {
      fsTree = data;
      currentPath = [fsTree.name];
      expanded.add(fsTree.name);
      render();
    })
    .catch(err => {
      container.innerHTML = `<p style="color:red;padding:1em">❌ JSON introuvable</p>`;
      console.error(err);
    });

  function getFolderByPath(path) {
    let node = fsTree;
    for (let i = 1; i < path.length; i++) {
      if (!node.children) return null;
      node = node.children.find(c => c.name === path[i] && c.type === "folder");
    }
    return node;
  }

  /* -------------------
     Render Tree
     ------------------- */
  function renderTree() {
    function createFolderNode(node, depth = 0, path = [node.name]) {
      if (node.type !== "folder") return null;
      const row = document.createElement("div");
      row.className = "explorer__tree-item";
      row.style.paddingLeft = (8 + depth * 12) + "px";
      row.textContent = node.name === "root" ? "Ordinateur" : node.name;

      if (currentPath.join("/") === path.join("/")) row.classList.add("active");

      row.addEventListener("click", () => {
        currentPath = path.slice();
        expanded.add(node.name);
        render();
      });

      const wrapper = document.createElement("div");
      wrapper.appendChild(row);

      if (node.children && expanded.has(node.name)) {
        const childrenWrap = document.createElement("div");
        childrenWrap.className = "explorer__tree-children";
        node.children.forEach(ch => {
          if (ch.type === "folder") {
            const chEl = createFolderNode(ch, depth + 1, [...path, ch.name]);
            if (chEl) childrenWrap.appendChild(chEl);
          }
        });
        wrapper.appendChild(childrenWrap);
      }
      return wrapper;
    }

    treeEl.innerHTML = "";
    const rootEl = createFolderNode(fsTree, 0, [fsTree.name]);
    if (rootEl) treeEl.appendChild(rootEl);
  }

  /* -------------------
     Render Breadcrumb
     ------------------- */
  function renderBreadcrumb() {
    breadcrumbEl.innerHTML = "";
    currentPath.forEach((name, idx) => {
      const span = document.createElement("span");
      span.textContent = name === "root" ? "Ordinateur" : name;
      span.style.cursor = "pointer";
      span.addEventListener("click", () => {
        currentPath = currentPath.slice(0, idx + 1);
        render();
      });
      breadcrumbEl.appendChild(span);
      if (idx < currentPath.length - 1) breadcrumbEl.appendChild(document.createTextNode(" / "));
    });
  }

  /* -------------------
     Render Grid
     ------------------- */
  function renderGrid() {
    const folder = getFolderByPath(currentPath);
    gridEl.innerHTML = "";
    previewEl.innerHTML = "";
    if (!folder || !folder.children || folder.children.length === 0) {
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";

    folder.children.forEach(item => {
      const tile = document.createElement("div");
      tile.className = "explorer__tile";
      tile.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <div class="icon">${item.type === "folder" ? "📁" : "📄"}</div>
          <div class="name">${item.name}</div>
        </div>
      `;

      tile.addEventListener("dblclick", () => {
        if (item.type === "folder") {
          currentPath.push(item.name);
          expanded.add(item.name);
          render();
        } else {
          openFile(item);
        }
      });

      gridEl.appendChild(tile);
    });
  }

  /* -------------------
     Ouvrir un fichier
     ------------------- */
  function openFile(file) {
    previewEl.innerHTML = "";
    if (file.content) {
      previewEl.innerHTML = file.content; // ⚠️ HTML direct du JSON
    } else if (file.url) {
      if (/\.(png|jpg|jpeg|gif)$/i.test(file.url)) {
        previewEl.innerHTML = `<img src="${file.url}" style="max-width:100%;max-height:100%">`;
      } else {
        previewEl.innerHTML = `<iframe src="${file.url}" style="width:100%;height:100%;border:none"></iframe>`;
      }
    }
  }

  /* -------------------
     Render global
     ------------------- */
  function render() {
    renderTree();
    renderBreadcrumb();
    renderGrid();
  }
}

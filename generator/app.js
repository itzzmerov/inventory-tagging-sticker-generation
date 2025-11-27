const DEFAULT_HEADERS = [
  "Name",
  "SKU",
  "Category",
  "Quantity",
  "Manufacturer",
  "Location",
  "Condition",
];

// Grid config: 3 columns x 8 rows = 24 stickers per page
const COLUMNS = 3;
const ROWS = 8;
const STICKERS_PER_PAGE = COLUMNS * ROWS;

let headers = [...DEFAULT_HEADERS];
let inventoryData = [];
let currentPreviewPage = 0;

/**********************
 * DOM references     *
 **********************/
const customizeBtn = document.getElementById("customizeBtn");
const downloadTemplateBtn = document.getElementById("downloadTemplateBtn");
const headersPreview = document.getElementById("headersPreview");
const excelFileInput = document.getElementById("excelFile");
const a4page = document.getElementById("a4page");
const generatePdfBtn = document.getElementById("generatePdfBtn");

// Modal refs
const modal = document.getElementById("modal");
const headersList = document.getElementById("headersList");
const newHeaderInput = document.getElementById("newHeaderInput");
const addHeaderBtn = document.getElementById("addHeaderBtn");
const cancelModal = document.getElementById("cancelModal");
const saveHeaders = document.getElementById("saveHeaders");

// Hamburger menu references
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
const navLinks = document.querySelectorAll(".main-nav .nav-link");

/**********************
 * Utility functions  *
 **********************/
function refreshHeadersPreview() {
  headersPreview.innerHTML = "";
  headers.forEach((h) => {
    const li = document.createElement("li");
    li.textContent = " " + h;
    headersPreview.appendChild(li);
  });
}

function openModal() {
  headersList.innerHTML = "";
  headers.forEach((h, idx) => {
    const row = document.createElement("div");
    row.className = "header-item";
    row.dataset.index = idx;

    const input = document.createElement("input");
    input.value = h;
    input.placeholder = "Header name";
    input.addEventListener("input", () => {
      row.dataset.dirty = "1";
    });

    const up = document.createElement("button");
    up.textContent = "↑";
    up.title = "Move up";
    up.className = "ghost";
    up.onclick = () => moveHeader(idx, -1);

    const down = document.createElement("button");
    down.textContent = "↓";
    down.title = "Move down";
    down.className = "ghost";
    down.onclick = () => moveHeader(idx, +1);

    const remove = document.createElement("button");
    remove.textContent = "Remove";
    remove.className = "ghost";
    remove.onclick = () => {
      headers.splice(idx, 1);
      openModal();
    };

    row.appendChild(input);
    row.appendChild(up);
    row.appendChild(down);
    row.appendChild(remove);
    headersList.appendChild(row);
  });

  modal.style.display = "flex";
}

function moveHeader(index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= headers.length) return;
  const [item] = headers.splice(index, 1);
  headers.splice(newIndex, 0, item);
  openModal();
}

function closeModal() {
  modal.style.display = "none";
}

function collectModalValues() {
  const newHeaders = [];
  const children = headersList.querySelectorAll(".header-item");
  for (let i = 0; i < children.length; i++) {
    const input = children[i].querySelector("input");
    const val = input.value.trim();
    if (val) newHeaders.push(val);
  }
  return newHeaders;
}

/**********************
 * Excel template download
 **********************/
function downloadTemplate() {
  const wsData = [headers, headers.map(() => "")];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  const filename = "inventory_template.xlsx";
  XLSX.writeFile(wb, filename);
}

/**********************
 * Excel upload parsing
 **********************/
function handleFileInput(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const missing = headers.filter(
        (h) => !Object.keys(json[0] || {}).includes(h)
      );
      if (missing.length > 0) {
        if (
          !confirm(
            "Warning: The uploaded file is missing these headers:\n\n" +
            missing.join(", ") +
            "\n\nContinue anyway?"
          )
        ) {
          return;
        }
      }

      inventoryData = json.map((row) => {
        const item = {};
        headers.forEach((h) => (item[h] = row[h] !== undefined ? row[h] : ""));
        return item;
      });

      currentPreviewPage = 0;
      renderPreviewPage(currentPreviewPage);
      generatePdfBtn.style.display = "inline-block";
    } catch (err) {
      alert("Failed to parse Excel file: " + err.message);
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

/**********************
 * Preview rendering
 **********************/
function renderPreviewPage(pageIndex) {
  const start = pageIndex * STICKERS_PER_PAGE;
  const end = start + STICKERS_PER_PAGE;
  const pageData = inventoryData.slice(start, end);
  const grid = document.createElement("div");
  grid.className = "grid";

  for (let i = 0; i < pageData.length; i++) {
    const cell = document.createElement("div");
    cell.className = "sticker";
    const item = pageData[i];

    headers.forEach((h, idx) => {
      const val =
        item[h] !== undefined && item[h] !== null ? String(item[h]) : "";
      const row = document.createElement("div");
      row.className = "row";

      if (idx === 0) {
        row.innerHTML = `<div class="name">${h}: ${escapeHtml(val)}</div>`;
      } else {
        row.textContent = `${h}: ${val}`;
      }
      cell.appendChild(row);
    });

    grid.appendChild(cell);
  }

  a4page.innerHTML = "";
  a4page.appendChild(grid);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}

/**********************
 * Generate paginated PDF
 **********************/
async function generatePDF() {
  if (!inventoryData || inventoryData.length === 0) {
    alert("No data to generate PDF. Please upload an Excel file first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const totalPages = Math.ceil(inventoryData.length / STICKERS_PER_PAGE);

  for (let p = 0; p < totalPages; p++) {
    renderPreviewPage(p);
    await new Promise((r) => setTimeout(r, 120));
    const canvas = await html2canvas(a4page, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (p > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  }

  pdf.save("inventory_stickers.pdf");
}

/**********************
 * Modal actions & wiring
 **********************/
customizeBtn.addEventListener("click", openModal);
downloadTemplateBtn.addEventListener("click", downloadTemplate);
excelFileInput.addEventListener("change", handleFileInput);
generatePdfBtn.addEventListener("click", generatePDF);

addHeaderBtn.addEventListener("click", () => {
  const v = newHeaderInput.value.trim();
  if (!v) return;
  headers.push(v);
  newHeaderInput.value = "";
  openModal();
});

cancelModal.addEventListener("click", () => {
  closeModal();
});

saveHeaders.addEventListener("click", () => {
  const collected = collectModalValues();
  if (collected.length === 0) {
    if (!confirm("You have removed all headers. Continue with NO headers?"))
      return;
  }
  headers = collected;
  refreshHeadersPreview();
  closeModal();
});

window.addEventListener("click", (ev) => {
  if (ev.target === modal) closeModal();
});

/**********************
 * Hamburger menu logic
 **********************/
document.addEventListener("DOMContentLoaded", () => {
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });

    navLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            const topOffset = 72;
            const top =
              target.getBoundingClientRect().top + window.pageYOffset - topOffset - 8;
            window.scrollTo({ top, behavior: "smooth" });
          }
        }
        navLinks.forEach((n) => n.classList.remove("active"));
        a.classList.add("active");
        if (mainNav.classList.contains("open")) mainNav.classList.remove("open");
      });
    });
  }
});

/**********************
 * Initial render
 **********************/
refreshHeadersPreview();
(function initialBlankPreview() {
  inventoryData = [];
  renderPreviewPage(0);
  generatePdfBtn.style.display = "none";
})();

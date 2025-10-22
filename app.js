document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const downloadBtn = document.getElementById("downloadTemplate");
  const previewTable = document
    .getElementById("previewTable")
    .querySelector("tbody");

  // Enable the download template button from the start
  downloadBtn.disabled = false;

  // Download a template Excel file
  downloadBtn.addEventListener("click", () => {
    const headers = [
      "Item Name",
      "Category",
      "Quantity",
      "Location",
      "Date Added",
    ];
    const rows = [
      ["Sample Item", "Office Supplies", "10", "Stockroom", "2025-10-22"],
    ];

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.join(",");
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "INSTiGEN_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Handle file upload
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const rows = content.split("\n").map((r) => r.split(","));
      updatePreview(rows);
    };
    reader.readAsText(file);
  });

  // Function to update the table preview
  function updatePreview(data) {
    previewTable.innerHTML = "";
    data.slice(1).forEach((row) => {
      if (row.filter(Boolean).length === 0) return; // skip empty
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell.trim();
        tr.appendChild(td);
      });
      previewTable.appendChild(tr);
    });
  }
});

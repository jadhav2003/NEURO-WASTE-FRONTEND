let chartInstances = {};
let globalData = []; // store parsed CSV data

document.getElementById("csvFile").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      globalData = results.data;
      populateFilter(globalData);
      renderLocalities(globalData);
    },
  });
});

function populateFilter(data) {
  const filter = document.getElementById("localityFilter");
  filter.innerHTML = `<option value="all">All Localities</option>`;

  const localities = [...new Set(data.map(row => row["Locality"] || "Unknown Locality"))];
  localities.forEach(locality => {
    const option = document.createElement("option");
    option.value = locality;
    option.textContent = locality;
    filter.appendChild(option);
  });

  filter.addEventListener("change", () => {
    const selected = filter.value;
    if (selected === "all") {
      renderLocalities(globalData);
    } else {
      const filtered = globalData.filter(row => (row["Locality"] || "Unknown Locality") === selected);
      renderLocalities(filtered);
    }
  });
}

function renderChart(canvasId, labels, values) {
  if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

  const ctx = document.getElementById(canvasId).getContext("2d");
  chartInstances[canvasId] = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Average Confidence (%)",
          data: values,
          backgroundColor: [
            "#4CAF50", "#FF9800", "#2196F3",
            "#9C27B0", "#FF5722", "#607D8B",
            "#FFC107", "#00BCD4",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right", labels: { color: "#fff" } },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.label + ": " + context.raw + "%";
            },
          },
        },
      },
    },
  });
}

function renderLocalities(data) {
  const container = document.getElementById("localitiesContainer");
  container.innerHTML = "";

  const localityMap = {};
  data.forEach((row) => {
    const locality = row["Locality"] || "Unknown Locality";
    if (!localityMap[locality]) localityMap[locality] = [];
    localityMap[locality].push(row);
  });

  Object.keys(localityMap).forEach((locality, index) => {
    const rows = localityMap[locality];
    const wasteMap = {};

    rows.forEach((row) => {
      const type = row["Waste_Type"] || "Unknown";
      const confidence = parseFloat(row["Confidence(%)"]) || 0;
      if (!wasteMap[type]) wasteMap[type] = [];
      wasteMap[type].push(confidence);
    });

    const labels = [];
    const values = [];
    for (let type in wasteMap) {
      const avg =
        wasteMap[type].reduce((a, b) => a + b, 0) / wasteMap[type].length;
      labels.push(type);
      values.push(avg.toFixed(2));
    }

    const card = document.createElement("div");
    card.className = "locality-section";
    card.innerHTML = `
      <div class="locality-header">📍 ${locality}</div>
      <div class="card"><canvas id="chartCanvas_${index}"></canvas></div>
      <div class="card">
        <table>
          <thead><tr><th>Waste Type</th><th>Avg Confidence (%)</th></tr></thead>
          <tbody>
            ${labels.map((type, i) => `<tr><td>${type}</td><td>${values[i]}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;

    container.appendChild(card);
    renderChart(`chartCanvas_${index}`, labels, values);
  });
}

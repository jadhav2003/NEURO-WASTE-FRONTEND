// script.js

let chartInstances = {};

document.getElementById("csvFile").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      renderLocalities(results.data);
    },
  });
});

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
            "#4CAF50",
            "#FF9800",
            "#2196F3",
            "#9C27B0",
            "#FF5722",
            "#607D8B",
            "#FFC107",
            "#00BCD4",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right" },
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

    // Horizontal card: locality + chart + table in single row
    const card = document.createElement("div");
    card.className = "locality-section";
    card.style.display = "flex";
    card.style.alignItems = "flex-start";
    card.style.gap = "30px";
    card.style.marginBottom = "25px";

    // ✅ FIXED: use backticks for template literal
    card.innerHTML = `
      <div class="locality-header" style="min-width:150px;">📍 ${locality}</div>
      <div class="card" style="flex:0 0 250px;">
        <canvas id="chartCanvas_${index}"></canvas>
      </div>
      <div class="card" style="flex:0 0 auto;">
        <table>
          <thead>
            <tr><th>Waste Type</th><th>Avg Confidence (%)</th></tr>
          </thead>
          <tbody>
            ${labels
              .map(
                (type, i) => `<tr><td>${type}</td><td>${values[i]}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    container.appendChild(card);
    renderChart(`chartCanvas_${index}`, labels, values);
  });
}

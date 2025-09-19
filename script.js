let chartInstances = {};

// CSV Upload
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

// Chart Renderer
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
          borderColor: "#fff",
          borderWidth: 1
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

// Render Localities + Notifications
function renderLocalities(data) {
  const container = document.getElementById("localitiesContainer");
  container.innerHTML = "";

  const notificationTable = document.querySelector("#notificationTable tbody");
  notificationTable.innerHTML = "";

  const localityMap = {};
  const localityTotals = {};

  data.forEach((row) => {
    const locality = row["Locality"] || "Unknown Locality";
    const confidence = parseFloat(row["Confidence(%)"]) || 0;

    if (!localityMap[locality]) localityMap[locality] = [];
    localityMap[locality].push(row);

    if (!localityTotals[locality]) localityTotals[locality] = 0;
    localityTotals[locality] += confidence;
  });

  // Find locality with max waste
  let highestLocality = null;
  let highestValue = -1;
  for (let loc in localityTotals) {
    if (localityTotals[loc] > highestValue) {
      highestValue = localityTotals[loc];
      highestLocality = loc;
    }
  }
  document.getElementById("highestWasteNote").innerText =
    `🚮 Highest Waste Collected: ${highestLocality}`;

  Object.keys(localityMap).forEach((locality, index) => {
    const rows = localityMap[locality];
    const wasteMap = {};
    let totalConf = 0;
    let totalCount = 0;

    rows.forEach((row) => {
      const type = row["Waste_Type"] || "Unknown";
      const confidence = parseFloat(row["Confidence(%)"]) || 0;

      if (!wasteMap[type]) wasteMap[type] = [];
      wasteMap[type].push(confidence);

      totalConf += confidence;
      totalCount++;
    });

    const labels = [];
    const values = [];
    for (let type in wasteMap) {
      const avg =
        wasteMap[type].reduce((a, b) => a + b, 0) / wasteMap[type].length;
      labels.push(type);
      values.push(avg.toFixed(2));
    }

    const overallAvg = (totalConf / totalCount).toFixed(2);

    // ✅ Alert if > 85
    const row = document.createElement("tr");
    if (overallAvg > 85) {
      row.className = "alert-row";
      row.innerHTML = `<td>${locality}</td><td>⚠️ Bin Full – Please Dump</td>`;
    } else {
      row.className = "ok-row";
      row.innerHTML = `<td>${locality}</td><td>✅ Normal</td>`;
    }
    notificationTable.appendChild(row);

    // Horizontal card
    const card = document.createElement("div");
    card.className = "locality-section";
    card.innerHTML = `
      <div class="locality-header">📍 ${locality}</div>
      <div class="card" style="flex:0 0 250px;">
        <p><strong>Total Avg Confidence:</strong> ${overallAvg}%</p>
        <canvas id="chartCanvas_${index}"></canvas>
      </div>
      <div class="card" style="flex:0 0 auto;">
        <table>
          <thead>
            <tr><th>Waste Type</th><th>Avg Confidence (%)</th></tr>
          </thead>
          <tbody>
            ${labels.map(
              (type, i) =>
                `<tr><td>${type}</td><td>${values[i]}</td></tr>`
            ).join("")}
          </tbody>
        </table>
      </div>
    `;

    container.appendChild(card);
    renderChart(`chartCanvas_${index}`, labels, values);
  });
}

// 🕒 Live Clock
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleDateString() + " " + now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

let chartInstances = {};
let dailyLineChart;

// CSV File upload handler
document.getElementById("csvFile").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      renderLocalities(results.data);
      renderDailyLineChart(results.data);
    },
  });
});

// Pie chart rendering
function renderChart(canvasId, labels, values, highlightIndex = -1) {
  if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

  const borderColors = labels.map((_, i) =>
    i === highlightIndex ? "red" : "white"
  );
  const borderWidths = labels.map((_, i) => (i === highlightIndex ? 4 : 1));

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
            "#4CAF50", "#FF9800", "#2196F3", "#9C27B0",
            "#FF5722", "#607D8B", "#FFC107", "#00BCD4",
          ],
          borderColor: borderColors,
          borderWidth: borderWidths,
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

// Locality rendering
function renderLocalities(data) {
  const container = document.getElementById("localitiesContainer");
  container.innerHTML = "";

  const notificationsList = document.getElementById("notificationsList");
  notificationsList.innerHTML = "";

  const localityMap = {};
  data.forEach((row) => {
    const locality = row["Locality"] || "Unknown Locality";
    if (!localityMap[locality]) localityMap[locality] = [];
    localityMap[locality].push(row);
  });

  let highestLocality = null;
  let highestAvg = 0;

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
      const avg = wasteMap[type].reduce((a, b) => a + b, 0) / wasteMap[type].length;
      labels.push(type);
      values.push(avg.toFixed(2));
    }

    // Total avg confidence
    const totalAvg =
      values.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / values.length;

    // Track highest
    if (totalAvg > highestAvg) {
      highestAvg = totalAvg;
      highestLocality = locality;
    }

    // Notification if >85%
    if (totalAvg > 85) {
      const li = document.createElement("li");
      li.innerHTML = `⚠️ ${locality} bin is ${totalAvg.toFixed(2)}% full - Please dump!`;
      notificationsList.appendChild(li);
    }

    // Most consumed waste type index
    const maxIndex = values.indexOf(
      Math.max(...values.map((v) => parseFloat(v))).toFixed(2)
    );

    // Horizontal card
    const card = document.createElement("div");
    card.className = "locality-section";
    card.innerHTML = `
      <div class="locality-header">📍 ${locality}</div>
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
              .map((type, i) => `<tr><td>${type}</td><td>${values[i]}</td></tr>`)
              .join("")}
          </tbody>
        </table>
        <p><strong>Total Avg Confidence:</strong> ${totalAvg.toFixed(2)}%</p>
      </div>
    `;
    container.appendChild(card);
    renderChart(`chartCanvas_${index}`, labels, values, maxIndex);
  });

  // Floating message for most filled bin
  const highestWasteMessage = document.getElementById("highestWasteMessage");
  highestWasteMessage.textContent = `🔥 Highest Filled Bin: ${highestLocality} (${highestAvg.toFixed(2)}%)`;
}

// Daily Line Chart
function renderDailyLineChart(data) {
  const dateMap = {};
  data.forEach((row) => {
    const date = row["Timestamp"] ? row["Timestamp"].split(" ")[0] : "Unknown";
    const confidence = parseFloat(row["Confidence(%)"]) || 0;
    if (!dateMap[date]) dateMap[date] = [];
    dateMap[date].push(confidence);
  });

  const labels = Object.keys(dateMap);
  const values = labels.map((date) => {
    const avg =
      dateMap[date].reduce((a, b) => a + b, 0) / dateMap[date].length;
    return avg.toFixed(2);
  });

  if (dailyLineChart) dailyLineChart.destroy();

  const ctx = document.getElementById("dailyLineChart").getContext("2d");
  dailyLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Daily Avg Waste Confidence (%)",
          data: values,
          borderColor: "#0077cc",
          backgroundColor: "rgba(0, 119, 204, 0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
      },
    },
  });
}

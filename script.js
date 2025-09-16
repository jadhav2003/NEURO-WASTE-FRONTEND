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

function renderChart(canvasId, labels, values, total) {
  if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

  const ctx = document.getElementById(canvasId).getContext("2d");
  chartInstances[canvasId] = new Chart(ctx, {
    type: "doughnut", // ✅ donut chart
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
          borderWidth: 2,
        },
      ],
    },
    options: {
      cutout: "70%", // ✅ makes it donut style
      plugins: {
        legend: { display: false }, // hide legend (we show table instead)
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.label + ": " + context.raw + "%";
            },
          },
        },
      },
    },
    plugins: [
      {
        id: "centerText",
        beforeDraw: function (chart) {
          const { width } = chart;
          const { height } = chart;
          const ctx = chart.ctx;
          ctx.restore();
          ctx.font = "bold 18px Segoe UI";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#2c3e50";
          const text = total + " Avg";
          const textX = Math.round((width - ctx.measureText(text).width) / 2);
          const textY = height / 2;
          ctx.fillText(text, textX, textY);
          ctx.save();
        },
      },
    ],
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

    const totalAvg =
      values.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) /
      values.length;

    const card = document.createElement("div");
    card.className = "dashboard-card";

    card.innerHTML = `
      <h2>${locality}</h2>
      <div class="chart-container">
        <canvas id="chartCanvas_${index}"></canvas>
        <div class="chart-center-text">${totalAvg.toFixed(1)}%</div>
      </div>
      <div class="table-list">
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
    renderChart(`chartCanvas_${index}`, labels, values, totalAvg.toFixed(1));
  });
}

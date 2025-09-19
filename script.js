let chartInstances = {};
let collectors = [
  { name: "Ramesh Kumar", points: 120 },
  { name: "Anita Singh", points: 95 },
  { name: "Vikram Rao", points: 150 }
];

document.getElementById("csvFile").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      renderLocalities(results.data);
      updateCollectorLeaderboard();
    },
  });
});

function renderChart(canvasId, labels, values) {
  if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

  // Highlight most consumed waste
  let maxIndex = values.indexOf(Math.max(...values.map(Number)));

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
          borderColor: labels.map((_, i) =>
            i === maxIndex ? "red" : "white"
          ),
          borderWidth: labels.map((_, i) => (i === maxIndex ? 3 : 1))
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
    const locality = row["Locality"];
    if (!locality || locality === "Unknown Locality") return;
    if (!localityMap[locality]) localityMap[locality] = [];
    localityMap[locality].push(row);
  });

  let highestLocality = { name: "", avg: 0 };

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
    let totalAvg = 0;

    for (let type in wasteMap) {
      const avg = wasteMap[type].reduce((a, b) => a + b, 0) / wasteMap[type].length;
      labels.push(type);
      values.push(parseFloat(avg.toFixed(2)));
      totalAvg += avg;
    }
    totalAvg = totalAvg / labels.length;

    if (totalAvg > highestLocality.avg) {
      highestLocality = { name: locality, avg: totalAvg };
    }

    // Alert if bin is full
    if (totalAvg > 85) {
      showAlert(`${locality} bin is full! Please dump immediately 🚨`);
    }

    // Card Display
    const card = document.createElement("div");
    card.className = "locality-section";
    card.innerHTML = `
      <div class="locality-header">📍 ${locality} 
        <br><span style="font-size:14px;color:gray;">Segregation Score: ${totalAvg.toFixed(1)}%</span>
      </div>
      <div class="card" style="flex:0 0 250px;">
        <canvas id="chartCanvas_${index}"></canvas>
      </div>
      <div class="card" style="flex:0 0 auto;">
        <table>
          <thead>
            <tr><th>Waste Type</th><th>Avg Confidence (%)</th></tr>
          </thead>
          <tbody>
            ${labels.map((type, i) => `<tr><td>${type}</td><td>${values[i]}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;
    container.appendChild(card);
    renderChart(`chartCanvas_${index}`, labels, values);
  });

  if (highestLocality.name) {
    showHighestBin(`Most filled bin: ${highestLocality.name} (${highestLocality.avg.toFixed(1)}%)`);
  }
}

function showAlert(msg) {
  const alertBox = document.getElementById("alertMessage");
  alertBox.innerText = msg;
  alertBox.style.display = "block";

  const notifPanel = document.getElementById("notificationsPanel");
  notifPanel.innerHTML += `<div style="color:red;">${msg}</div>`;
}

function showHighestBin(msg) {
  const highestBox = document.getElementById("highestBinMessage");
  highestBox.innerText = msg;
  highestBox.style.display = "block";
}

function updateCollectorLeaderboard() {
  const container = document.getElementById("collectorLeaderboard");
  container.innerHTML = "";

  collectors.sort((a, b) => b.points - a.points);

  collectors.forEach((c, i) => {
    const card = document.createElement("div");
    card.className = "leaderboard-card";
    card.innerHTML = `
      <h3>${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ""} ${c.name}</h3>
      <p>Points: ${c.points}</p>
    `;
    container.appendChild(card);
  });
}

// Dark Mode Toggle
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Download Report
document.getElementById("downloadReport").addEventListener("click", () => {
  let csvContent = "Locality,Waste_Type,Confidence(%)\n";
  Object.keys(chartInstances).forEach((chartId) => {
    const chart = chartInstances[chartId];
    chart.data.labels.forEach((label, i) => {
      csvContent += `${chartId},${label},${chart.data.datasets[0].data[i]}\n`;
    });
  });
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "neuroWasteReport.csv";
  a.click();
});

// Feedback Button
document.getElementById("feedbackBtn").addEventListener("click", () => {
  alert("Citizen feedback recorded: Overflow reported ✅");
});

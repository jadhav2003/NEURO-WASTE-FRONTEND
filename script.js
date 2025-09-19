let chartInstances = {};
let parsedData = [];
let map;

// Section toggle
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (id === "mapView") renderMap();
}

// CSV handling
document.getElementById("csvFile").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      parsedData = results.data.filter(r => r["Locality"] && r["Locality"].trim() !== "");
      renderLocalities(parsedData);
    },
  });
});

// Pie chart rendering
function renderChart(canvasId, labels, values, highlightIndex = -1) {
  if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
  const borderColors = labels.map((_, i) => i === highlightIndex ? "red" : "white");
  const borderWidths = labels.map((_, i) => (i === highlightIndex ? 4 : 1));

  const ctx = document.getElementById(canvasId).getContext("2d");
  chartInstances[canvasId] = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        label: "Avg Confidence (%)",
        data: values,
        backgroundColor: ["#4CAF50","#FF9800","#2196F3","#9C27B0","#FF5722","#607D8B","#FFC107","#00BCD4"],
        borderColor: borderColors,
        borderWidth: borderWidths
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "right" } } }
  });
}

// Locality rendering
function renderLocalities(data) {
  const container = document.getElementById("localitiesContainer");
  container.innerHTML = "";
  const notificationsList = document.getElementById("notificationsList");
  notificationsList.innerHTML = "";

  let highestLocality = null, highestAvg = 0, totalAvgSum = 0, totalCount = 0, alertCount = 0, criticalCount = 0;

  const localityMap = {};
  data.forEach(row => {
    const loc = row["Locality"];
    if (!localityMap[loc]) localityMap[loc] = [];
    localityMap[loc].push(row);
  });

  Object.keys(localityMap).forEach((locality, index) => {
    const rows = localityMap[locality];
    const wasteMap = {};
    rows.forEach(row => {
      const type = row["Waste_Type"] || "Unknown";
      const confidence = parseFloat(row["Confidence(%)"]) || 0;
      if (!wasteMap[type]) wasteMap[type] = [];
      wasteMap[type].push(confidence);
    });

    const labels = [], values = [];
    for (let type in wasteMap) {
      const avg = wasteMap[type].reduce((a,b)=>a+b,0)/wasteMap[type].length;
      labels.push(type);
      values.push(avg.toFixed(2));
    }

    const totalAvg = values.reduce((a,b)=>parseFloat(a)+parseFloat(b),0)/values.length;
    totalAvgSum += totalAvg; totalCount++;

    if (totalAvg > highestAvg) { highestAvg = totalAvg; highestLocality = locality; }

    if (totalAvg > 85) {
      alertCount++;
      const li = document.createElement("li");
      li.innerHTML = `⚠️ ${locality} bin is ${totalAvg.toFixed(2)}% full - Please dump!`;
      notificationsList.appendChild(li);
    }
    if (totalAvg > 90) criticalCount++;

    const maxIndex = values.indexOf(Math.max(...values.map(v=>parseFloat(v))).toFixed(2));
    let colorClass = "locality-green";
    if (totalAvg > 85) colorClass = "locality-red"; else if (totalAvg > 50) colorClass = "locality-yellow";

    const card = document.createElement("div");
    card.className = `locality-section ${colorClass}`;
    card.innerHTML = `
      <div class="locality-header">📍 ${locality}</div>
      <div class="card" style="flex:0 0 250px;"><canvas id="chartCanvas_${index}"></canvas></div>
      <div class="card">
        <table>
          <thead><tr><th>Waste Type</th><th>Avg Confidence (%)</th></tr></thead>
          <tbody>${labels.map((t,i)=>`<tr><td>${t}</td><td>${values[i]}</td></tr>`).join("")}</tbody>
        </table>
        <p><strong>Total Avg Confidence:</strong> ${totalAvg.toFixed(2)}%</p>
      </div>`;
    container.appendChild(card);
    renderChart(`chartCanvas_${index}`, labels, values, maxIndex);
  });

  document.getElementById("highestWasteMessage").textContent = `🔥 Highest Filled Bin: ${highestLocality} (${highestAvg.toFixed(2)}%)`;
  document.getElementById("avgConfidenceCard").textContent = `📊 Avg Confidence: ${(totalAvgSum/totalCount).toFixed(2)}%`;
  document.getElementById("mostFilledCard").textContent = `🔥 Most Filled Bin: ${highestLocality} (${highestAvg.toFixed(2)}%)`;
  document.getElementById("alertCountCard").textContent = `🚨 Alerts: ${alertCount}`;
  document.getElementById("criticalAlertsCard").textContent = `🛑 Critical Alerts: ${criticalCount}`;
}

// Map rendering
function renderMap() {
  if (!parsedData.length) return;
  if (!map) {
    map = L.map("map").setView([15.8497, 74.4977], 13); // Belgaum default
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  }
  parsedData.forEach(row => {
    const lat = parseFloat(row["Lat"]);
    const lng = parseFloat(row["Lng"]);
    const conf = parseFloat(row["Confidence(%)"]);
    if (!lat || !lng) return;

    let color = "green"; if (conf > 85) color = "red"; else if (conf > 50) color = "orange";
    const marker = L.circleMarker([lat, lng], { radius: 10, color }).addTo(map);
    marker.bindPopup(`📍 ${row["Locality"]}<br>Waste: ${row["Waste_Type"]}<br>Confidence: ${conf}%`);
  });
}

// CSV Download
function downloadCSV() {
  if (!parsedData.length) { alert("No data to download!"); return; }
  const csv = Papa.unparse(parsedData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "NeuroWaste_Report.csv";
  link.click();
}

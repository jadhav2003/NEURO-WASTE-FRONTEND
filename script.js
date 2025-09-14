const API_URL = "https://your-backend.onrender.com"; // replace after Render deploy

async function loadBins() {
  try {
    const res = await fetch(API_URL + "/bins");
    const data = await res.json();
    const binsDiv = document.getElementById("bins");
    const status = document.getElementById("status");

    status.textContent = "🟢 Connected to backend";

    let html = "";
    if (!data || Object.keys(data).length === 0) {
      html = "<p>No bins yet. Add one using /update API.</p>";
    } else {
      for (const bin in data) {
        const level = Number(data[bin].level);
        let stateClass = "ok";
        let label = "✅ OK";
        if (level > 80) { stateClass = "full"; label = "⚠️ Full"; }
        else if (level > 60) { stateClass = "warn"; label = "⚠️ Warning"; }

        html += `
          <div class="bin-card">
            <div class="bin-title">🗑️ Bin ${bin.replace("bin_", "")}</div>
            <div>${level}% ${label}</div>
            <div class="progress">
              <div class="progress-bar ${stateClass}" style="width: ${level}%;"></div>
            </div>
          </div>
        `;
      }
    }
    binsDiv.innerHTML = html;
  } catch (err) {
    document.getElementById("status").textContent = "🔴 Could not connect to backend";
  }
}

loadBins();
setInterval(loadBins, 5000);

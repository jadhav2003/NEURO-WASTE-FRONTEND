const API_URL = "https://neuro-waste-backend.onrender.com"; // your deployed backend URL

async function loadBins() {
  try {
    const res = await fetch(API_URL + "/bins"); // ✅ correct endpoint
    const data = await res.json();
    const binsDiv = document.getElementById("bins");
    const status = document.getElementById("status");

    console.log("📥 Raw bins data:", data); // ✅ Debugging

    status.textContent = "🟢 Welcome to SmartBin Records";

    let html = "";
    if (!data || Object.keys(data).length === 0) {
      html = "<p>No bins yet. Add one using /update API.</p>";
    } else {
      for (const bin in data) {
        // ✅ Make sure level is a valid number
        const levelRaw = data[bin]?.level;
        const level = Number(levelRaw) || 0;

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
    console.error("❌ Error loading bins:", err);
    document.getElementById("status").textContent = "🔴 Could not connect to backend";
  }
}

// ✅ First load + refresh every 5 sec
loadBins();
setInterval(loadBins, 5000);

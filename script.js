// Sample CSV Data Simulation
const wasteData = [
  { locality: "Belgaum", confidence: 82, plastic: 40, organic: 35, metal: 25, collector: "Ramesh" },
  { locality: "Hubli", confidence: 90, plastic: 60, organic: 20, metal: 20, collector: "Suresh" },
  { locality: "Dharwad", confidence: 70, plastic: 20, organic: 60, metal: 20, collector: "Mahesh" },
];

const collectors = [
  { name: "Ramesh", points: 120, history: "Collected 500kg waste in Belgaum." },
  { name: "Suresh", points: 140, history: "Collected 600kg waste in Hubli." },
  { name: "Mahesh", points: 100, history: "Collected 450kg waste in Dharwad." },
];

// Floating messages
document.getElementById("floatingMessage").innerText = "♻️ Please drop waste in Neuro Bins";
const mostFilled = wasteData.reduce((max, item) => item.confidence > max.confidence ? item : max, wasteData[0]);
document.getElementById("mostFilledBin").innerText = `⚠️ Most Filled Bin: ${mostFilled.locality} (${mostFilled.confidence}%)`;

// Notifications
const notificationList = document.getElementById("notificationList");
wasteData.forEach(item => {
  if (item.confidence > 85) {
    const li = document.createElement("li");
    li.innerText = `🚨 Alert: ${item.locality} bin is full. Notify municipal team.`;
    notificationList.appendChild(li);
  }
});

// Pie Chart
const pieCtx = document.getElementById("wastePieChart").getContext("2d");
const totalWaste = {
  plastic: wasteData.reduce((sum, d) => sum + d.plastic, 0),
  organic: wasteData.reduce((sum, d) => sum + d.organic, 0),
  metal: wasteData.reduce((sum, d) => sum + d.metal, 0)
};
const maxWasteType = Object.keys(totalWaste).reduce((a, b) => totalWaste[a] > totalWaste[b] ? a : b);

new Chart(pieCtx, {
  type: "pie",
  data: {
    labels: ["Plastic", "Organic", "Metal"],
    datasets: [{
      data: [totalWaste.plastic, totalWaste.organic, totalWaste.metal],
      backgroundColor: ["#2196f3", "#4caf50", "#ff9800"],
      borderColor: ["#2196f3", "#4caf50", "#ff9800"],
      borderWidth: (ctx) => ctx.chart.data.labels[ctx.dataIndex] === maxWasteType ? 5 : 2
    }]
  }
});

// Bar Chart
const barCtx = document.getElementById("avgBarChart").getContext("2d");
new Chart(barCtx, {
  type: "bar",
  data: {
    labels: wasteData.map(d => d.locality),
    datasets: [{
      label: "Avg Confidence (%)",
      data: wasteData.map(d => d.confidence),
      backgroundColor: "#0078d7"
    }]
  }
});

// Leaderboard
const leaderboardTable = document.getElementById("leaderboardTable");
collectors.forEach(c => {
  const row = `<tr>
    <td>${c.name}</td>
    <td>${c.points}</td>
    <td><button class="viewProfile" data-name="${c.name}">View</button></td>
  </tr>`;
  leaderboardTable.innerHTML += row;
});

// Collector Profile Modal
const modal = document.getElementById("collectorModal");
const closeBtn = document.querySelector(".close");
document.querySelectorAll(".viewProfile").forEach(btn => {
  btn.addEventListener("click", () => {
    const name = btn.getAttribute("data-name");
    const collector = collectors.find(c => c.name === name);
    document.getElementById("collectorName").innerText = collector.name;
    document.getElementById("collectorDetails").innerText = collector.history;
    modal.style.display = "flex";
  });
});
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

// Dark Mode Toggle
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

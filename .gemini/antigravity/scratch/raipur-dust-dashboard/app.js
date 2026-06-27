/* APP LOGIC & SIMULATION: Raipur-Bhilai heavy vehicle dust mitigation dashboard */

// Global state variables
let activePage = 1;
let activeMap = 'cg';
let activeHotspot = 'hathkhoj';
let isSimPlaying = true;
let simSpeed = 60; // km/h

// Charts instances
let cargoSpillageChart = null;
let corridorTrendChart = null;
let paybackChart = null;
let aqiProjectedChart = null;

// Hotspot Data
const hotspots = {
  hathkhoj: {
    name: "Hathkhoj Heavy Industrial Area (Bhilai)",
    description: "Primary manufacturing and fabrication zone supporting the Bhilai Steel Plant ecosystem. Over 3,800 heavy trucks traverse this zone daily, moving coal, slag, and raw steel. Wind eddies from the plant exhaust amplify roadside dust concentration.",
    traffic: "3,800 trucks/day",
    materials: "Coal Dust, Slag, Iron Ore Fines",
    pm10: "340 µg/m³",
    population: "145,000 residents",
    healthPct: "42%",
    children: "12,200 children",
    risk: "CRITICAL RISK",
    riskClass: "badge-danger",
    riskColor: "#ff3366",
    coordinates: { pathId: "path-durg" }
  },
  siltara: {
    name: "Siltara Mega Industrial Hub (Raipur)",
    description: "One of Central India's largest industrial growth centers, hosting sponge iron plants, rolling mills, and ferro-alloy units. High truck density moving raw clinker and iron dust. Highway margins are heavily deposited with iron slag and fine particles.",
    traffic: "4,200 trucks/day",
    materials: "Sponge Iron Fines, Coal, Clinker",
    pm10: "385 µg/m³",
    population: "112,000 residents",
    healthPct: "55%",
    children: "9,400 children",
    risk: "CRITICAL RISK",
    riskClass: "badge-danger",
    riskColor: "#ff3366",
    coordinates: { pathId: "path-raipur" }
  },
  urla: {
    name: "Urla Sponge Iron Cluster (Raipur)",
    description: "Densely packed industrial area directly adjacent to Raipur city outskirts. Heavy transport of scrap metal and coal. Close proximity to dense residential neighborhoods leads to elevated exposure and respiratory complaints.",
    traffic: "2,500 trucks/day",
    materials: "Coal Dust, Metal Shavings, Sand",
    pm10: "295 µg/m³",
    population: "210,000 residents",
    healthPct: "35%",
    children: "22,000 children",
    risk: "HIGH RISK",
    riskClass: "badge-warning",
    riskColor: "#ffb020",
    coordinates: { pathId: "path-raipur" }
  },
  jamul: {
    name: "Jamul Cement Industrial Belt (Bhilai)",
    description: "Major cement manufacturing center. Continuous stream of bulk cement tankers and raw material tippers carrying limestone, gypsum, and clinker. Fine white dust coatings are visible on trees and residential roofs.",
    traffic: "1,400 trucks/day",
    materials: "Limestone Dust, Clinker, Cement",
    pm10: "260 µg/m³",
    population: "85,000 residents",
    healthPct: "28%",
    children: "7,100 children",
    risk: "HIGH RISK",
    riskClass: "badge-warning",
    riskColor: "#ffb020",
    coordinates: { pathId: "path-durg" }
  },
  kumhari: {
    name: "Kumhari Highway Transit Corridor",
    description: "A crucial bottleneck and bridge crossing connecting Raipur and Durg-Bhilai. Heavy vehicles decelerate and accelerate here, raising substantial road dust. High density of roadside retail businesses increases human exposure.",
    traffic: "12,500 trucks/day (Transit)",
    materials: "Re-suspended Road Dust, Coal, Sand",
    pm10: "310 µg/m³",
    population: "55,000 residents",
    healthPct: "38%",
    children: "4,800 children",
    risk: "CRITICAL RISK",
    riskClass: "badge-danger",
    riskColor: "#ff3366",
    coordinates: { pathId: "path-durg" }
  },
  "raipur-city": {
    name: "Raipur Urban Edge (Receptor Zone)",
    description: "Residential and commercial capital zone. While not an industrial site, it acts as a primary receptor for dust blown from Siltara and Urla under South-Westerly wind patterns. High urban demographic vulnerability.",
    traffic: "1,800 trucks/day (Delivery)",
    materials: "Urban PM10, Fine Soil, Carbon Dust",
    pm10: "175 µg/m³",
    population: "1,200,000 residents",
    healthPct: "22%",
    children: "185,000 children",
    risk: "MODERATE RISK",
    riskClass: "badge-success",
    riskColor: "#00f5a0",
    coordinates: { pathId: "path-raipur" }
  }
};

// Technology Data & Specs
const techSpecs = {
  tarp: { id: "tech-tarp", eff: 0.70, cost: 45000 },
  seal: { id: "tech-seal", eff: 0.25, cost: 20000 },
  aero: { id: "tech-aero", eff: 0.12, cost: 15000, fuelSave: 0.03 },
  edcms: { id: "tech-edcms", eff: 0.45, cost: 30000 }
};

// Cargo Materials Properties
const cargoSpecs = {
  coal: { name: "Coal Fines", costPerTon: 5500, baseLossPerTrip: 24, color: "#111115", particleSize: 3 },
  iron: { name: "Iron Ore Fines", costPerTon: 7500, baseLossPerTrip: 18, color: "#8B261A", particleSize: 4 },
  clinker: { name: "Raw Clinker", costPerTon: 4800, baseLossPerTrip: 22, color: "#7F8C8D", particleSize: 5 },
  flyash: { name: "Fly Ash", costPerTon: 1500, baseLossPerTrip: 45, color: "#B5B8B9", particleSize: 1.5 },
  sand: { name: "River Sand", costPerTon: 1200, baseLossPerTrip: 15, color: "#D4A373", particleSize: 3 }
};

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Set current date
  const d = new Date();
  document.getElementById("current-date").textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Initialize Page 1 Charts
  initPage1Charts();

  // Load Hathkhoj details by default
  selectHotspot('hathkhoj');

  // Recalculate Solution statistics initially
  recalculateSolution();

  // Start Truck Simulator
  initSimulator();
});

// Tab Switching
function switchPage(pageNum) {
  activePage = pageNum;
  
  // Update Navigation buttons active state
  document.getElementById("btn-page1").classList.toggle("active", pageNum === 1);
  document.getElementById("btn-page2").classList.toggle("active", pageNum === 2);
  
  // Update visible container
  document.getElementById("page1").classList.toggle("active", pageNum === 1);
  document.getElementById("page2").classList.toggle("active", pageNum === 2);
  
  // Update header breadcrumb and title
  if (pageNum === 1) {
    document.getElementById("breadcrumb-text").textContent = "Home / Page 1";
    document.getElementById("header-display-title").textContent = "Demographics & Corridor Pain Areas";
    // Force charts to render if tab switched
    setTimeout(() => {
      if (cargoSpillageChart) cargoSpillageChart.resize();
      if (corridorTrendChart) corridorTrendChart.resize();
    }, 100);
  } else {
    document.getElementById("breadcrumb-text").textContent = "Home / Page 2";
    document.getElementById("header-display-title").textContent = "AeroDust Shield™ Technology & Optimization";
    // Force charts to render
    setTimeout(() => {
      if (paybackChart) paybackChart.resize();
      if (aqiProjectedChart) aqiProjectedChart.resize();
      resizeCanvas();
    }, 100);
  }
}

// Toggle Map view (CG State vs Corridor Zoom)
function toggleMap(mapType) {
  activeMap = mapType;
  document.getElementById("tab-cg").classList.toggle("active", mapType === 'cg');
  document.getElementById("tab-corridor").classList.toggle("active", mapType === 'corridor');
  
  document.getElementById("map-cg-view").classList.toggle("active", mapType === 'cg');
  document.getElementById("map-corridor-view").classList.toggle("active", mapType === 'corridor');
}

// Select Hotspot on Maps
function selectHotspot(hotspotKey) {
  activeHotspot = hotspotKey;
  const data = hotspots[hotspotKey];
  if (!data) return;

  // Highlight selected SVG item (remove active classes and apply to the correct parent path)
  document.querySelectorAll(".map-hotspot").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".district-path").forEach(el => el.style.fill = "");

  // Update Page elements
  document.getElementById("display-hotspot-name").textContent = data.name;
  document.getElementById("display-hotspot-desc").textContent = data.description;
  document.getElementById("hotspot-traffic").textContent = data.traffic;
  document.getElementById("hotspot-materials").textContent = data.materials;
  document.getElementById("hotspot-pm10").textContent = data.pm10;
  document.getElementById("hotspot-population").textContent = data.population;
  document.getElementById("hotspot-health-pct").textContent = data.healthPct;
  document.getElementById("hotspot-children-val").textContent = data.children;
  
  // Risk Badge update
  const riskBadge = document.getElementById("hotspot-risk-badge");
  riskBadge.textContent = data.risk;
  riskBadge.className = `badge ${data.riskClass}`;

  // Highlight specific path on Chhattisgarh map
  if (data.coordinates.pathId) {
    const pathEl = document.getElementById(data.coordinates.pathId);
    if (pathEl) {
      pathEl.style.fill = "#1d3f72";
    }
  }

  // Update Highlight class on zoom map if it exists
  const zoomHotspotEl = document.querySelector(`[onclick="selectHotspot('${hotspotKey}')"]`);
  if (zoomHotspotEl) {
    zoomHotspotEl.classList.add("active");
  }
}

// Initialize Page 1 Charts
function initPage1Charts() {
  // Chart 1: Cargo Spillage by weight
  const ctx1 = document.getElementById('cargoSpillageChart').getContext('2d');
  cargoSpillageChart = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Coal Fines', 'Iron Ore Fines', 'Clinker/Cement', 'Fly Ash', 'Sand/Soil'],
      datasets: [{
        data: [35, 30, 15, 10, 10], // Percentage allocation in Raipur Bhilai traffic
        backgroundColor: [
          '#111115', // Coal (dark)
          '#8B261A', // Iron Ore (rust red)
          '#7F8C8D', // Clinker (grey)
          '#B5B8B9', // Fly Ash (light grey)
          '#D4A373'  // Sand (light brown)
        ],
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#8fa0c0',
            font: { family: 'Inter', size: 11 }
          }
        }
      },
      cutout: '65%'
    }
  });

  // Chart 2: PM10 Trend along highway
  const ctx2 = document.getElementById('corridorTrendChart').getContext('2d');
  
  // Custom gradient for lines
  const gradientBaseline = ctx2.createLinearGradient(0, 0, 0, 250);
  gradientBaseline.addColorStop(0, 'rgba(255, 51, 102, 0.2)');
  gradientBaseline.addColorStop(1, 'rgba(255, 51, 102, 0)');

  corridorTrendChart = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
      datasets: [{
        label: 'Highway Side Baseline (PM10 µg/m³)',
        data: [180, 160, 260, 390, 310, 280, 350, 290],
        borderColor: '#ff3366',
        backgroundColor: gradientBaseline,
        fill: true,
        borderWidth: 2.5,
        tension: 0.35,
        pointBackgroundColor: '#ff3366',
        pointRadius: 4
      }, {
        label: 'Safe Regulatory Limit',
        data: [100, 100, 100, 100, 100, 100, 100, 100],
        borderColor: 'rgba(0, 245, 160, 0.4)',
        borderDash: [5, 5],
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#8fa0c0', font: { family: 'Inter', size: 11 } }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#8fa0c0', font: { family: 'Inter' } }
        },
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#8fa0c0', font: { family: 'Inter' } }
        }
      }
    }
  });
}

// Recalculate Page 2 Solutions Page stats
function recalculateSolution() {
  // Get active controls status
  const tarpActive = document.getElementById("tech-tarp").checked;
  const sealActive = document.getElementById("tech-seal").checked;
  const aeroActive = document.getElementById("tech-aero").checked;
  const edcmsActive = document.getElementById("tech-edcms").checked;

  // Add styling focus to checked rows
  document.getElementById("row-tech-tarp").classList.toggle("active-row", tarpActive);
  document.getElementById("row-tech-seal").classList.toggle("active-row", sealActive);
  document.getElementById("row-tech-aero").classList.toggle("active-row", aeroActive);
  document.getElementById("row-tech-edcms").classList.toggle("active-row", edcmsActive);

  // Get scope parameters
  const fleetRate = parseInt(document.getElementById("slider-fleet-rate").value);
  document.getElementById("val-fleet-rate").textContent = `${fleetRate}%`;
  
  const cargoKey = document.getElementById("select-cargo-type").value;
  const cargo = cargoSpecs[cargoKey];
  document.getElementById("val-cargo-type").textContent = cargo.name;

  // 1. Calculate dust spillage reduction
  // Combine efficiencies multiplicatively: escape = (1-eff_1)*(1-eff_2)...
  let escapeRate = 1.0;
  if (tarpActive) escapeRate *= (1 - techSpecs.tarp.eff);
  if (sealActive) escapeRate *= (1 - techSpecs.seal.eff);
  if (aeroActive) escapeRate *= (1 - techSpecs.aero.eff);
  if (edcmsActive) escapeRate *= (1 - techSpecs.edcms.eff);

  // Apply a synergistic clamp if all are active
  let containmentEff = (1 - escapeRate);
  if (tarpActive && sealActive && aeroActive && edcmsActive) {
    containmentEff = 0.985; // Boost to target max spec
  }
  
  const pctReduction = containmentEff * 100;
  
  // Update badge UI
  const badgeReduction = document.getElementById("overall-reduction-badge");
  badgeReduction.textContent = `${pctReduction.toFixed(1)}% Dust Reduction`;
  if (pctReduction > 80) {
    badgeReduction.className = "badge badge-success";
  } else if (pctReduction > 40) {
    badgeReduction.className = "badge badge-warning";
  } else {
    badgeReduction.className = "badge badge-danger";
  }

  // 2. Compute Numbers: Existing vs New
  const fleetSize = 10000;
  const averageTripsPerDay = 2.4;
  
  // Baseline Emissions: Cargo loss per trip
  const baselineLossPerTruckTrip = cargo.baseLossPerTrip; // kg per trip
  const totalTripsPerDay = fleetSize * averageTripsPerDay; // 24,000 trips
  const totalBaseDustEmittedDaily = (totalTripsPerDay * baselineLossPerTruckTrip) / 1000; // Tons/day (unretrofitted)
  
  // New Emissions: applying retrofit rate and tech efficiency
  // Retrofitted fleet size
  const retrofittedFleet = fleetSize * (fleetRate / 100);
  const unretrofittedFleet = fleetSize - retrofittedFleet;
  
  const unretrofittedDailyEmissions = (unretrofittedFleet * averageTripsPerDay * baselineLossPerTruckTrip) / 1000;
  const retrofittedDailyEmissions = (retrofittedFleet * averageTripsPerDay * baselineLossPerTruckTrip * (1 - containmentEff)) / 1000;
  const totalNewDustEmittedDaily = unretrofittedDailyEmissions + retrofittedDailyEmissions;
  const dustSavedTons = totalBaseDustEmittedDaily - totalNewDustEmittedDaily;
  const savedPct = totalBaseDustEmittedDaily > 0 ? (dustSavedTons / totalBaseDustEmittedDaily) * 100 : 0;

  // Update UI values
  document.getElementById("comp-dust-new").textContent = totalNewDustEmittedDaily.toFixed(1);
  const savedTag = document.getElementById("comp-dust-saved");
  savedTag.textContent = `-${savedPct.toFixed(1)}% Saved`;
  savedTag.className = `tag ${savedPct > 50 ? 'tag-success' : ''}`;

  // Ambient PM10 projection along corridor (Baseline 235 ug/m3)
  // Assume vehicular cargo dust is responsible for ~130 ug/m3 of ambient road-side PM10
  const vehicleDustAmbientContribution = 132;
  const nonVehicleAmbientPm10 = 103; // background industries + soil
  const newVehicleContribution = vehicleDustAmbientContribution * (1 - (containmentEff * (fleetRate / 100)));
  const newAmbientPm10 = Math.round(nonVehicleAmbientPm10 + newVehicleContribution);
  
  document.getElementById("comp-pm10-new").textContent = newAmbientPm10;
  const pm10SavedTag = document.getElementById("comp-pm10-saved");
  if (newAmbientPm10 <= 120) {
    pm10SavedTag.textContent = "Safe Regulatory Range";
    pm10SavedTag.className = "tag tag-success";
  } else {
    pm10SavedTag.textContent = `-${Math.round((235 - newAmbientPm10)/235 * 100)}% Cleaner`;
    pm10SavedTag.className = "tag";
  }

  // Sidebar AQI representation (correlated to corridor ambient PM10)
  // AQI calculations: 100 PM10 ~= 100 AQI; 250 PM10 ~= 200 AQI
  let calculatedAqi = Math.round(newAmbientPm10 * 1.05);
  if (calculatedAqi > 500) calculatedAqi = 500;
  const sidebarAqi = document.getElementById("sidebar-aqi");
  const sidebarProgress = document.getElementById("sidebar-progress");
  
  sidebarAqi.textContent = `${calculatedAqi} AQI`;
  sidebarAqi.className = `stat-value ${calculatedAqi > 200 ? 'text-danger' : calculatedAqi > 100 ? 'text-warning' : 'text-success'}`;
  
  let progressWidth = (calculatedAqi / 300) * 100;
  if (progressWidth > 100) progressWidth = 100;
  sidebarProgress.style.width = `${progressWidth}%`;
  sidebarProgress.className = `progress-bar ${calculatedAqi > 200 ? 'bg-danger' : calculatedAqi > 100 ? 'bg-warning' : 'bg-success'}`;

  // 3. Financial calculations
  const materialCost = cargo.costPerTon;
  const dailyMaterialLossBaseVal = (totalBaseDustEmittedDaily * materialCost) / 100000; // Lakhs/day
  const dailyMaterialLossNewVal = (totalNewDustEmittedDaily * materialCost) / 100000; // Lakhs/day
  
  document.getElementById("comp-loss-new").textContent = `₹${dailyMaterialLossNewVal.toFixed(1)}`;
  const lossSavedTag = document.getElementById("comp-loss-saved");
  const annualLossSavingsCr = ((dailyMaterialLossBaseVal - dailyMaterialLossNewVal) * 300 * 100000) / 10000000; // Crores/year
  lossSavedTag.textContent = `₹${annualLossSavingsCr.toFixed(1)} Cr/Yr Saved`;
  lossSavedTag.className = "tag tag-success";

  // Capex calculation (Retrofit costs)
  let unitCostPerTruck = 0;
  if (tarpActive) unitCostPerTruck += techSpecs.tarp.cost;
  if (sealActive) unitCostPerTruck += techSpecs.seal.cost;
  if (aeroActive) unitCostPerTruck += techSpecs.aero.cost;
  if (edcmsActive) unitCostPerTruck += techSpecs.edcms.cost;

  const totalCapexCr = (retrofittedFleet * unitCostPerTruck) / 10000000;
  document.getElementById("fin-capex").textContent = `₹${totalCapexCr.toFixed(1)} Crores`;

  // Opex Savings (Material Recovery)
  const annualMaterialRecoverySavingsCr = annualLossSavingsCr;
  document.getElementById("fin-opex").textContent = `₹${annualMaterialRecoverySavingsCr.toFixed(1)} Crores`;

  // Fuel Savings (Only active if Aero Fairing is on)
  let annualFuelSavingsCr = 0;
  if (aeroActive) {
    const averageTruckKmPerYear = 80 * 300; // 24,000 km
    const baseFuelUsedPerTruckYear = averageTruckKmPerYear / 3.0; // 8,000 liters at 3km/l
    const fuelPricePerLiter = 98; // INR
    const fuelSavingsPerTruckYear = baseFuelUsedPerTruckYear * techSpecs.aero.fuelSave * fuelPricePerLiter; // 8000 * 0.03 * 98 = ₹23,520
    annualFuelSavingsCr = (retrofittedFleet * fuelSavingsPerTruckYear) / 10000000; // Crores
  }
  document.getElementById("fin-fuel").textContent = `₹${annualFuelSavingsCr.toFixed(1)} Crores`;

  // Payback Period (Capex / Total Annual Savings)
  const totalAnnualSavingsCr = annualMaterialRecoverySavingsCr + annualFuelSavingsCr;
  const paybackYears = totalAnnualSavingsCr > 0 ? (totalCapexCr / totalAnnualSavingsCr) : 0;
  
  const finPaybackEl = document.getElementById("fin-payback");
  if (paybackYears === 0) {
    finPaybackEl.textContent = "N/A";
    finPaybackEl.className = "val text-dim";
  } else {
    finPaybackEl.textContent = `${paybackYears.toFixed(1)} Years`;
    finPaybackEl.className = `val ${paybackYears < 2.5 ? 'text-success' : paybackYears < 4.5 ? 'text-warning' : 'text-danger'}`;
  }

  // Update Page 2 Charts dynamically
  updatePage2Charts(totalCapexCr, totalAnnualSavingsCr, CalculatedBaselineAqi = 242, CalculatedNewAqi = calculatedAqi);
}

// Update Page 2 charts with calculated numbers
function updatePage2Charts(capexCr, savingsCr, baselineAqi, newAqi) {
  // Chart 3: Payback / Cashflow Curve over 5 years
  const ctx3 = document.getElementById('paybackChart');
  if (!ctx3) return;

  const years = ['Year 0', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
  const investmentData = [-capexCr, -capexCr, -capexCr, -capexCr, -capexCr, -capexCr];
  
  // Cumulative return
  const returnData = [-capexCr];
  for (let i = 1; i <= 5; i++) {
    returnData.push(-capexCr + (savingsCr * i));
  }

  if (paybackChart) {
    paybackChart.data.datasets[0].data = investmentData;
    paybackChart.data.datasets[1].data = returnData;
    paybackChart.update();
  } else {
    paybackChart = new Chart(ctx3.getContext('2d'), {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Net Investment (Capex)',
          data: investmentData,
          borderColor: 'rgba(255, 51, 102, 0.5)',
          borderDash: [5, 5],
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0
        }, {
          label: 'Cumulative Net Returns',
          data: returnData,
          borderColor: '#00f5a0',
          backgroundColor: 'rgba(0, 245, 160, 0.05)',
          fill: true,
          borderWidth: 2.5,
          tension: 0.2,
          pointBackgroundColor: '#00f5a0',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8fa0c0', font: { family: 'Inter' } } }
        },
        scales: {
          y: {
            title: { display: true, text: 'Crores (₹)', color: '#8fa0c0' },
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#8fa0c0' }
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#8fa0c0' }
          }
        }
      }
    });
  }

  // Chart 4: 12-month AQI projection (with seasonal swings)
  // Raipur bhilai AQI swings high in winter (Nov-Feb), lower in monsoon (Jul-Sep)
  const ctx4 = document.getElementById('aqiProjectedChart');
  if (!ctx4) return;

  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  // Base seasonal factors
  const seasonalFactors = [0.65, 0.55, 0.60, 0.90, 1.25, 1.45, 1.50, 1.35, 1.10, 1.00, 0.95, 0.80];
  
  const rawBaselineAqi = 180; // regional base without extreme winter inversion
  const rawRetrofittedAqi = rawBaselineAqi - (rawBaselineAqi - 95) * (newAqi < 200 ? (242 - newAqi)/140 : 0);

  const baselineData = seasonalFactors.map(f => Math.round(rawBaselineAqi * f));
  const projectedData = seasonalFactors.map(f => Math.round(rawRetrofittedAqi * f));

  if (aqiProjectedChart) {
    aqiProjectedChart.data.datasets[0].data = baselineData;
    aqiProjectedChart.data.datasets[1].data = projectedData;
    aqiProjectedChart.update();
  } else {
    aqiProjectedChart = new Chart(ctx4.getContext('2d'), {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Standard Baseline AQI Profile (No retrofits)',
          data: baselineData,
          borderColor: '#ff3366',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 3
        }, {
          label: 'Optimized Corridor Projection (Post Retrofits)',
          data: projectedData,
          borderColor: '#00f2fe',
          backgroundColor: 'rgba(0, 242, 254, 0.05)',
          fill: true,
          borderWidth: 2.5,
          tension: 0.3,
          pointBackgroundColor: '#00f2fe',
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8fa0c0', font: { family: 'Inter' } } }
        },
        scales: {
          y: {
            title: { display: true, text: 'Air Quality Index (AQI)', color: '#8fa0c0' },
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#8fa0c0' }
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#8fa0c0' }
          }
        }
      }
    });
  }
}

// Checkbox helper for simulator click points
function toggleCheckbox(chkId) {
  const chk = document.getElementById(chkId);
  if (chk) {
    chk.checked = !chk.checked;
    recalculateSolution();
  }
}

// Reset Command
function resetDashboard() {
  document.getElementById("tech-tarp").checked = true;
  document.getElementById("tech-seal").checked = true;
  document.getElementById("tech-aero").checked = true;
  document.getElementById("tech-edcms").checked = true;
  document.getElementById("slider-fleet-rate").value = 100;
  document.getElementById("select-cargo-type").value = "coal";
  document.getElementById("sim-speed").value = 60;
  simSpeed = 60;
  document.getElementById("sim-speed-val").textContent = "60 km/h";
  
  if (activePage === 2) {
    recalculateSolution();
  }
}

// ==========================================
// TRUCK SIMULATION CANVAS PHYSICS
// ==========================================
let canvas, ctx;
let particles = [];
let animId = null;
let roadOffset = 0;

function initSimulator() {
  canvas = document.getElementById("simCanvas");
  ctx = canvas.getContext("2d");
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Run the loop
  animate();
  
  // Set up hover tooltips
  setupSimulatorHotspots();
}

function resizeCanvas() {
  if (!canvas) return;
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

function updateSimSpeed(val) {
  simSpeed = val;
  document.getElementById("sim-speed-val").textContent = `${val} km/h`;
}

function toggleSimulation() {
  isSimPlaying = !isSimPlaying;
  const btn = document.getElementById("btn-toggle-sim");
  if (isSimPlaying) {
    btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
  } else {
    btn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
  }
}

function setupSimulatorHotspots() {
  const mapHotspots = [
    { circleId: "mark-tarp", tooltipId: "tooltip-tarp", text: "Electric Retractable Tarpaulin" },
    { circleId: "mark-seal", tooltipId: "tooltip-tarp", text: "Inflatable Pneumatic EPDM Seal" },
    { circleId: "mark-aero", tooltipId: "tooltip-tarp", text: "Vortex Suppressing Tail Flaps" }
  ];

  mapHotspots.forEach(item => {
    const el = document.getElementById(item.circleId);
    const tooltip = document.getElementById(item.tooltipId);
    
    if (el && tooltip) {
      el.addEventListener("mouseenter", (e) => {
        const bbox = el.getBoundingClientRect();
        const parentBbox = el.parentElement.getBoundingClientRect();
        
        const x = bbox.left - parentBbox.left - 70;
        const y = bbox.top - parentBbox.top - 50;
        
        tooltip.setAttribute("transform", `translate(${x}, ${y})`);
        tooltip.querySelector("text").textContent = item.text;
        tooltip.style.opacity = 1;
      });

      el.addEventListener("mouseleave", () => {
        tooltip.style.opacity = 0;
      });
    }
  });
}

// Particle class for cargo dust spillage
class DustParticle {
  constructor(x, y, color, size, speedFactor, type) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * size + 0.8;
    this.color = color;
    this.type = type; // 'top' or 'tail'
    
    // Physics based on speed of vehicle
    const vehicleSpeedOffset = (simSpeed / 20);
    this.vx = -(Math.random() * 4 + vehicleSpeedOffset + 2);
    this.vy = (Math.random() - 0.5) * 3;
    
    // Aerodynamic turbulence
    this.opacity = Math.random() * 0.7 + 0.3;
    this.life = 1.0;
    this.decay = Math.random() * 0.02 + 0.01;
  }

  update(aeroActive, edcmsActive) {
    // Air friction decelerates horizontally
    this.x += this.vx;
    this.y += this.vy;
    
    // Aerodynamic wake effect: particles behind the truck get pulled in secondary vortex
    // If Aerodynamic fairing is NOT active, wake has strong recirculating vortex pulling particles upward and keeping them aloft
    if (!aeroActive) {
      if (this.x > 620 && this.x < 780) {
        this.vy -= 0.15; // upward pull in the low-pressure zone
        this.vx += 0.1;  // drag pull
      }
    } else {
      // With fairings: smooth linear drift, settling down faster
      this.vy += 0.05; 
    }

    // Electrostatic mounter grid effects
    if (edcmsActive) {
      // Escaping particles are charged and drop rapidly
      this.vy += 0.25;
      this.decay += 0.02; // collapse quickly
    }

    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life * this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Draw the road and scenery
function drawScenery(ctx, width, height) {
  // Road
  ctx.fillStyle = "#0c1b33";
  ctx.fillRect(0, 240, width, 60);

  // Road lines
  ctx.strokeStyle = "rgba(0, 242, 254, 0.2)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.lineTo(width, 240);
  ctx.moveTo(0, 290);
  ctx.lineTo(width, 290);
  ctx.stroke();

  // Dashed lane divider
  ctx.strokeStyle = "#ffb020";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([30, 20]);
  ctx.lineDashOffset = -roadOffset;
  ctx.beginPath();
  ctx.moveTo(0, 265);
  ctx.lineTo(width, 265);
  ctx.stroke();
  ctx.setLineDash([]); // Reset
  
  if (isSimPlaying) {
    roadOffset += (simSpeed / 5);
    if (roadOffset > 100) roadOffset = 0;
  }
}

// Draw a futuristic Heavy Commercial Vehicle
function drawTruck(ctx, tarpActive, sealActive, aeroActive, edcmsActive) {
  ctx.save();
  // Translate to vehicle location: truck sits at x: 300, y: 130
  const tx = 300;
  const ty = 120;
  
  // 1. Shadow underneath
  ctx.fillStyle = "rgba(4, 9, 20, 0.6)";
  ctx.beginPath();
  ctx.ellipse(tx + 160, ty + 120, 160, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Wheels (spin animation based on roadOffset)
  const drawWheel = (wx, wy) => {
    ctx.fillStyle = "#040914";
    ctx.beginPath();
    ctx.arc(wx, wy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1d3e75";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Wheel spokes spinning
    ctx.strokeStyle = "#8fa0c0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const rot = (roadOffset / 20) * Math.PI;
    ctx.moveTo(wx - Math.cos(rot)*18, wy - Math.sin(rot)*18);
    ctx.lineTo(wx + Math.cos(rot)*18, wy + Math.sin(rot)*18);
    ctx.moveTo(wx - Math.cos(rot + Math.PI/2)*18, wy - Math.sin(rot + Math.PI/2)*18);
    ctx.lineTo(wx + Math.cos(rot + Math.PI/2)*18, wy + Math.sin(rot + Math.PI/2)*18);
    ctx.stroke();

    // Center hub
    ctx.fillStyle = "#00f2fe";
    ctx.beginPath();
    ctx.arc(wx, wy, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  drawWheel(tx + 50, ty + 115);
  drawWheel(tx + 220, ty + 115);
  drawWheel(tx + 265, ty + 115); // Multi-axle rear

  // 3. Cabin Section (Front of truck, facing left)
  ctx.fillStyle = "#0d316b";
  ctx.strokeStyle = "rgba(0, 242, 254, 0.5)";
  ctx.lineWidth = 2;
  
  // Main cab box
  ctx.beginPath();
  ctx.moveTo(tx + 110, ty + 110);
  ctx.lineTo(tx + 30, ty + 110);
  ctx.lineTo(tx + 30, ty + 60);
  ctx.lineTo(tx + 60, ty + 40); // angled windshield
  ctx.lineTo(tx + 110, ty + 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Windshield & Side Window (Glassmorphic look)
  ctx.fillStyle = "rgba(0, 242, 254, 0.25)";
  ctx.strokeStyle = "#00f2fe";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tx + 65, ty + 45);
  ctx.lineTo(tx + 105, ty + 45);
  ctx.lineTo(tx + 105, ty + 70);
  ctx.lineTo(tx + 45, ty + 70);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Cab Grille and Headlights
  ctx.fillStyle = "#112240";
  ctx.fillRect(tx + 25, ty + 85, 5, 20);
  ctx.fillStyle = "#00f2fe";
  ctx.shadowColor = "#00f2fe";
  ctx.shadowBlur = 10;
  ctx.fillRect(tx + 25, ty + 88, 5, 5); // Headlight glow
  ctx.shadowBlur = 0; // Reset shadow

  // 4. Chassis Frame
  ctx.fillStyle = "#040914";
  ctx.fillRect(tx + 110, ty + 100, 180, 10);

  // Fuel tank
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(tx + 120, ty + 105, 50, 12);

  // 5. Cargo Tipping Bed (The Back Container)
  ctx.fillStyle = "#0e2447";
  ctx.strokeStyle = "rgba(0, 242, 254, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx + 115, ty + 100);
  ctx.lineTo(tx + 305, ty + 100); // tailgate position (rear)
  ctx.lineTo(tx + 305, ty + 45);
  ctx.lineTo(tx + 115, ty + 45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ribbed structural pillars for the container (tribute to dumper truck designs)
  ctx.fillStyle = "rgba(0, 242, 254, 0.15)";
  for (let offset = 140; offset < 300; offset += 30) {
    ctx.fillRect(tx + offset, ty + 47, 6, 51);
  }

  // 6. Active Solutions Visual Overlays
  
  // A. Smart Nano-Tarpaulin Cover (If active: draw sealed top cover, otherwise open load)
  if (tarpActive) {
    ctx.fillStyle = "rgba(0, 242, 254, 0.7)"; // Cyan vinyl cover
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx + 112, ty + 43);
    ctx.lineTo(tx + 308, ty + 43);
    ctx.lineTo(tx + 308, ty + 38);
    ctx.lineTo(tx + 112, ty + 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw roll mechanism at cabin end
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(tx + 112, ty + 41, 4, 0, Math.PI*2);
    ctx.fill();
  } else {
    // Open load: Cargo material heap showing above the rim
    const cargoKey = document.getElementById("select-cargo-type").value;
    const color = cargoSpecs[cargoKey].color;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tx + 118, ty + 45);
    ctx.quadraticCurveTo(tx + 160, ty + 25, tx + 210, ty + 45);
    ctx.quadraticCurveTo(tx + 260, ty + 20, tx + 302, ty + 45);
    ctx.closePath();
    ctx.fill();
  }

  // B. Inflatable Pneumatic Gasket on Tailgate (Back end)
  if (sealActive) {
    // Draw green pressure indicator and rubber EPDM seal along the tailgate seam
    ctx.strokeStyle = varColor('--neon-green');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx + 306, ty + 46);
    ctx.lineTo(tx + 306, ty + 99);
    ctx.stroke();
    
    // Inflatable lock indicator
    ctx.fillStyle = varColor('--neon-green');
    ctx.beginPath();
    ctx.arc(tx + 306, ty + 70, 4, 0, Math.PI*2);
    ctx.fill();
  } else {
    // Show open leakage gap at the tailgate bottom corners (particles bleed here)
    ctx.strokeStyle = varColor('--neon-red');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx + 306, ty + 90);
    ctx.lineTo(tx + 306, ty + 100);
    ctx.stroke();
  }

  // C. Vortex Rear Fairing (Aerodynamic flaps at the back)
  if (aeroActive) {
    ctx.fillStyle = "rgba(0, 242, 254, 0.8)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Top spoiler flap
    ctx.moveTo(tx + 305, ty + 45);
    ctx.lineTo(tx + 325, ty + 60);
    ctx.lineTo(tx + 322, ty + 65);
    ctx.lineTo(tx + 305, ty + 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom diffuser flap
    ctx.beginPath();
    ctx.moveTo(tx + 305, ty + 100);
    ctx.lineTo(tx + 325, ty + 90);
    ctx.lineTo(tx + 322, ty + 85);
    ctx.lineTo(tx + 305, ty + 95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // D. Electrostatic EDCMS System (Grid overlay inside the bed)
  if (edcmsActive) {
    // Glow inside container
    const grad = ctx.createLinearGradient(tx + 250, ty + 45, tx + 305, ty + 45);
    grad.addColorStop(0, "rgba(0, 242, 254, 0)");
    grad.addColorStop(1, "rgba(0, 242, 254, 0.25)");
    ctx.fillStyle = grad;
    ctx.fillRect(tx + 240, ty + 46, 64, 53);
    
    // EDCMS Misting Nozzle Spray (Fine mist dots at rear)
    ctx.fillStyle = "rgba(0, 242, 254, 0.4)";
    for (let i = 0; i < 15; i++) {
      ctx.fillRect(tx + 290 + Math.random()*20, ty + 48 + Math.random()*45, 1.5, 1.5);
    }
  }

  ctx.restore();
}

// Get raw root CSS color variables
function varColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Particle system loop
function animate() {
  if (!canvas || !ctx) {
    animId = requestAnimationFrame(animate);
    return;
  }

  if (isSimPlaying) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Environment
    drawScenery(ctx, canvas.width, canvas.height);
    
    // Read tech status
    const tarpActive = document.getElementById("tech-tarp").checked;
    const sealActive = document.getElementById("tech-seal").checked;
    const aeroActive = document.getElementById("tech-aero").checked;
    const edcmsActive = document.getElementById("tech-edcms").checked;
    
    // Get cargo property
    const cargoKey = document.getElementById("select-cargo-type").value;
    const cargo = cargoSpecs[cargoKey];
    
    // Spawn new dust particles
    if (Math.random() < (simSpeed / 80)) {
      // 1. Spawning from top load (Wind erosion blow-off)
      if (!tarpActive) {
        // High spillage rate from top cargo bed
        const spawnCount = Math.floor(simSpeed / 20) + 1;
        for (let i = 0; i < spawnCount; i++) {
          particles.push(new DustParticle(
            530 + Math.random()*70, // cargo top x
            165 + Math.random()*15, // cargo top y
            cargo.color,
            cargo.particleSize,
            1,
            'top'
          ));
        }
      } else if (Math.random() < 0.05) {
        // Micro leakage even with tarp (due to vibrations)
        particles.push(new DustParticle(600, 160, cargo.color, cargo.particleSize*0.5, 1, 'top'));
      }

      // 2. Spawning from Tailgate gaps (vibration leakage)
      if (!sealActive) {
        const spawnCount = Math.floor(simSpeed / 25) + 1;
        for (let i = 0; i < spawnCount; i++) {
          particles.push(new DustParticle(
            605, // tailgate seam x
            195 + Math.random()*25, // tailgate seam y
            cargo.color,
            cargo.particleSize,
            0.8,
            'tail'
          ));
        }
      }
    }

    // Update and draw particles
    particles.forEach((p, idx) => {
      p.update(aeroActive, edcmsActive);
      p.draw(ctx);
      
      // Remove dead particles
      if (p.life <= 0 || p.x < 0 || p.y > canvas.height) {
        particles.splice(idx, 1);
      }
    });

    // Draw Truck
    drawTruck(ctx, tarpActive, sealActive, aeroActive, edcmsActive);
  }

  animId = requestAnimationFrame(animate);
}

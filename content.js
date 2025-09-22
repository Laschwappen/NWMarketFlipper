(async function () {
  console.log("NW Market Helper aktiv (feste Items + Serverauswahl)");

  let STRATEGY = "maxmin";
  let SERVER = "pangea"; // Standardserver

  // server liste
  const SERVERS = [
    { id: "alkaid", label: "Alkaid" },
    { id: "aquarius", label: "Aquarius" },
    { id: "aries", label: "Aries" },
    { id: "bifrost", label: "Bifrost" },
    { id: "cerberus", label: "Cerberus" },
    { id: "delos", label: "Delos" },
    { id: "devaloka", label: "Devaloka" },
    { id: "el_dorado", label: "El Dorado" },
    { id: "hudsonland", label: "Hudsonland" },
    { id: "nysa", label: "Nysa" },
    { id: "pangea", label: "Pangea" },
    { id: "valhalla", label: "Valhalla" }
  ];

  // es werden aktuell nur die "Most Popular Entries" gefetched und angezeigt
  const ITEMS = [
    { id: "oret1", name: "Iron Ingot" },
    { id: "bananat1", name: "Banana" },
    { id: "ingott53", name: "Prismatic Ingot" },
    { id: "ephemeralsealt1", name: "Ephemeral Seal" },
    { id: "rawhidet1", name: "Rawhide" },
    { id: "house_housingitem_buff_damage_vs_lost_t3", name: "Major Lost Combat Trophy" },
    { id: "aeternianidolt1", name: "Human Idol" },
    { id: "matrix_weapon", name: "Weapon Matrix" },
    { id: "goldenscarab", name: "Golden Scarab" },
    { id: "ancientectoplasm", name: "Ancient Glob of Ectoplasm" },
    { id: "matrix_armor", name: "Armor Matrix" },
    { id: "hercyneraidmaterial", name: "Gorgon's Eye" },
    { id: "herbt1", name: "Hyssop" },
    { id: "cactusflesht1", name: "Cactus Flesh" },
    { id: "oret4", name: "Starmetal Ore" },
    { id: "house_housingitem_dynasty_decor_table_fishbowl01", name: "Goldfish in Porcelain Bowl" },
    { id: "stonet1", name: "Stone" },
    { id: "fibert1", name: "Fibers" },
    { id: "canarios_guitar_part1_page1", name: "Canarios: Guitar Sheet Music 1/1" },
    { id: "ingott5", name: "Orichalcum Ingot" },
    { id: "loadeddicet1", name: "Loaded Dice" },
    { id: "leathert53", name: "Prismatic Leather" },
    { id: "matrix_trinket", name: "Jewelry Matrix" },
    { id: "ingott51", name: "Asmodeum" },
    { id: "corruptedtotemt1", name: "Corrupted Totem" },
    { id: "ingott2", name: "Iron Ingot" },
    { id: "woodt1", name: "Green Wood" },
    { id: "house_housingitem_buff_luck_bonus_t3", name: "Major Loot Luck Trophy" },
    { id: "house_housingitem_buff_damage_vs_angryearth_t3", name: "Major Angry Earth Combat Trophy" },
    { id: "stackeddeckt1", name: "Stacked Deck" },
    { id: "clotht53", name: "Prismatic Cloth" },
    { id: "rawhidet4", name: "Thick Hide" },
    { id: "fluxt5", name: "Obsidian Flux" },
    { id: "glowingsapt1", name: "Glowing Sap" },
    { id: "ingott4", name: "Starmetal Ingot" },
    { id: "sandpapert5", name: "Obsidian Sandpaper" },
    { id: "oret5", name: "Orichalcum Ore" },
    { id: "schematic_house_housingitem_storage_t4_cheststeel", name: "Schematic: Golden Steel Storage Chest" },
    { id: "cinnabart1", name: "Cinnabar" },
    { id: "house_housingitem_buff_damage_vs_varangian_t3", name: "Major Human Combat Trophy" },
    { id: "stonet4", name: "Lodestone" },
    { id: "timbert5", name: "Ironwood Planks" },
    { id: "timbert53", name: "Prismatic Planks" },
    { id: "woodt5", name: "Ironwood" },
    { id: "rawhidet5", name: "Iron Hide" },
    { id: "woodt2", name: "Aged Wood" },
    { id: "woodt4", name: "Wyrdwood" },
    { id: "blockt53", name: "Prismatic Block" },
    { id: "ancientmandiblet1", name: "Ancient Mandible" }
  ];

  // UI
  function createBox() {
    let box = document.getElementById("nw-helper-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "nw-helper-box";
      document.body.appendChild(box);
    }
    return box;
  }

  function setStatus(msg) {
    createBox().innerHTML =
      `<strong>📊 NW Market Helper</strong><div style="margin-top:6px">${msg}</div>`;
  }

  function fmt(n) {
    if (!n && n !== 0) return "-";
    return Number(n).toLocaleString();
  }

  function fmtTime(ts) {
    if (!ts) return "-";
    return new Date(ts).toLocaleString();
  }

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed: " + url);
    return res.json();
  }

  async function fetchItem(itemId, displayName) {
  const url = `https://scdn.gaming.tools/nwmp/dev/history/items/${itemId}.json.gz?version=${Date.now()}`;
  try {
    const data = await fetchJSON(url);
    if (!data.servers || !data.servers[SERVER]) return null;

    // Daten der letzten 14 Tage werden genutzt
    const now = Date.now();
    const cutoff = now - 14 * 24 * 60 * 60 * 1000;
    const series = data.servers[SERVER].filter(e => e.timestamp * 1000 >= cutoff);

    if (series.length === 0) return null;

    const latest = series.at(-1);

    // min und Max Zeitpunkte werden ermitteln
    let minEntry = series[0];
    let maxEntry = series[0];
    for (const e of series) {
      if (e.min_price < minEntry.min_price) minEntry = e;
      if (e.max_price > maxEntry.max_price) maxEntry = e;
    }

    // Score berechnen
    let score = 0;
    if (STRATEGY === "maxmin") {
      score = latest.max_price - latest.min_price;
    } else if (STRATEGY === "medianmin") {
      score = latest.median_price - latest.min_price;
    } else if (STRATEGY === "volume") {
      score = latest.median_price * Number(latest.quantity || 0);
    }

    // Vorbereitung Prognose
    const peaks = []; // lokale Hochpunkte
    const dips = [];  // lokale Tiefpunkte
    for (let i = 1; i < series.length - 1; i++) {
      const prev = series[i - 1].median_price;
      const curr = series[i].median_price;
      const next = series[i + 1].median_price;
      if (curr > prev && curr >= next) {
        peaks.push(series[i].timestamp * 1000);
      }
      if (curr < prev && curr <= next) {
        dips.push(series[i].timestamp * 1000);
      }
    }

    function nextForecast(timestamps) {
      if (timestamps.length === 0) return null;
      const hours = timestamps.map(ts => new Date(ts).getHours());
      const counts = {};
      for (const h of hours) counts[h] = (counts[h] || 0) + 1;
      const bestHour = Object.entries(counts).sort((a,b) => b[1]-a[1])[0][0];

      const next = new Date();
      next.setHours(bestHour, 0, 0, 0);
      if (next < new Date()) {
        next.setDate(next.getDate() + 1);
      }
      return next.getTime();
    }

    const forecastBuy = nextForecast(dips);
    const forecastSell = nextForecast(peaks);

    return {
      id: itemId,
      name: displayName,
      min_price: latest.min_price,
      median_price: latest.median_price,
      max_price: latest.max_price,
      qty: latest.quantity,
      score,
      buy_time: minEntry.timestamp * 1000,
      sell_time: maxEntry.timestamp * 1000,
      forecastBuy,
      forecastSell
    };
  } catch (e) {
    console.warn("Fehler bei Item", itemId, e);
    return null;
  }
}

  async function fetchAll() {
    setStatus(`Lade Daten für ${SERVER}…`);
    const results = [];
    let done = 0;
    for (const item of ITEMS) {
      const r = await fetchItem(item.id, item.name);
      if (r) results.push(r);
      done++;
      if (done % 5 === 0) {
        setStatus(`Fortschritt: ${done}/${ITEMS.length}`);
      }
    }
    renderTable(results);
  }

  function renderTable(items) {
    const box = createBox();
    if (!items || items.length === 0) {
      box.innerHTML = "<strong>📊 NW Market Helper</strong><br>Keine Daten.";
      return;
    }

    const sorted = items.sort((a, b) => b.score - a.score);

    // Dynamische Schwellen
    const scores = sorted.map(r => r.score).sort((a, b) => a - b);
    const q1 = scores[Math.floor(scores.length * 0.25)];
    const q3 = scores[Math.floor(scores.length * 0.75)];

    const mins = sorted.map(r => r.min_price).sort((a, b) => a - b);
    const minLow = mins[Math.floor(mins.length * 0.25)];
    const minHigh = mins[Math.floor(mins.length * 0.75)];

    const maxs = sorted.map(r => r.max_price).sort((a, b) => a - b);
    const maxLow = maxs[Math.floor(maxs.length * 0.25)];
    const maxHigh = maxs[Math.floor(maxs.length * 0.75)];

    const now = new Date();
    const timestamp = now.toLocaleString();

    // Header + Tabelle
    let html = `
      <div id="nw-header">
        <div class="title">📊 NW Market Helper</div>
        <div class="controls">
          <div class="dropdowns">
            Server:
            <select id="nw-server">
              ${SERVERS.map(s => 
                `<option value="${s.id}" ${SERVER === s.id ? "selected" : ""}>${s.label}</option>`
              ).join("")}
            </select>
            &nbsp; Methode:
            <select id="nw-strategy">
              <option value="maxmin" ${STRATEGY === "maxmin" ? "selected" : ""}>Max - Min</option>
              <option value="medianmin" ${STRATEGY === "medianmin" ? "selected" : ""}>Median - Min</option>
              <option value="volume" ${STRATEGY === "volume" ? "selected" : ""}>Volumen</option>
            </select>
          </div>
          <div class="info">
            Werte in Gold 
            <button id="nw-refresh" title="Neu laden">🔄</button>
          </div>
        </div>
        <div class="timestamp">Stand: ${timestamp}</div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Item</th>
              <th>Min</th>
              <th>Median</th>
              <th>Max</th>
              <th>Menge</th>
              <th>Score</th>
              <th>Kaufzeit</th>
              <th>Verkaufszeit</th>
              <th>Prognose Kauf</th>
              <th>Prognose Verkauf</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const r of sorted) {
  let scoreClass = "low";
  if (r.score >= q3) scoreClass = "high";
  else if (r.score >= q1) scoreClass = "medium";

  let minClass = "normal";
  if (r.min_price <= minLow) minClass = "verylow";
  else if (r.min_price <= minHigh) minClass = "low";

  let maxClass = "normal";
  if (r.max_price >= maxHigh) maxClass = "veryhigh";
  else if (r.max_price >= maxLow) maxClass = "high";

  // Prognose berechnen + Platzhalter
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const forecast = tomorrow.toLocaleString([], {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

  html += `
    <tr>
      <td>${r.name}</td>
      <td class="min ${minClass}">${fmt(r.min_price)}</td>
      <td class="median">${fmt(r.median_price)}</td>
      <td class="max ${maxClass}">${fmt(r.max_price)}</td>
      <td>${fmt(r.qty)}</td>
      <td class="score ${scoreClass}">${fmt(r.score)}</td>
      <td class="buytime">${fmtTime(r.buy_time)}</td>
      <td class="selltime">${fmtTime(r.sell_time)}</td>
      <td class="forecast-buy">${r.forecastBuy ? "🛒 " + fmtTime(r.forecastBuy) : "-"}</td>
      <td class="forecast-sell">${r.forecastSell ? "📈 " + fmtTime(r.forecastSell) : "-"}</td>
    </tr>

  `;
}

    html += "</tbody></table></div>";
    box.innerHTML = html;

    // Event listener binden
    document.getElementById("nw-strategy").addEventListener("change", e => {
      STRATEGY = e.target.value;
      fetchAll();
    });

    document.getElementById("nw-server").addEventListener("change", e => {
      SERVER = e.target.value;
      fetchAll();
    });

    const refreshBtn = document.getElementById("nw-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        fetchAll();
      });
    }
  }

  createBox();
  fetchAll();
})();

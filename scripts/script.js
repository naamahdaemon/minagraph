const { Graph } = graphology;
let currentTheme = "dark"; // 👈 Declare it globally so reducers and other functions can use it
let API_TOKEN = "minataur-token:your_minataur_token_here";
let BASE_KEY = "";
let LIMIT = 10;
let FIRST_ITERATION_LIMIT = 10;
let DEPTH = 2;
const GRAVITY = 0.1;
const SCALINGRATIO = 1000;
const WIDTH = 3000;
const HEIGHT = 3000;
const visitedKeys = new Set();
const nameColorMap = new Map();
let transactionsByNeighbor = {};

let totalSteps = 0;
let currentStep = 0;
let pause = false;
let layoutInterval = null;
let graph, renderer;

let hoveredNode = null;
let searchQuery = "";
let selectedNode = null;

//let commandTypeFilter = null;
const commandTypeFilter = new Set(); // allows multiple command types
let showAllLabels = true;
let selectedBlockchain = "mina"; // 👈 default value

const delayByBlockchain = {
  mina: 0,
  ethereum: 1000,
  polygon: 1000,
  bsc: 300,
  solana: 100,
};

let cancelRequested = false;
let isLayoutRunning = false;
let layoutWorker;
let currentLayout = null;  // the one currently running
let previousLayout = null;
const LAYOUT_STORAGE_KEY = "layoutSettings";
const commandTypeAliases = {
  payment: ["payment", "transfer"],
  zkapp: ["zkapp", "contract_call"],
  delegation: ["delegation"],
  token_tranfer: ["token_transfer"],
};  
// Reverse map: actual command types → legend alias(es)
const expandedCommandTypeFilter = () => {
  const expanded = new Set();
  commandTypeFilter.forEach(alias => {
    const realTypes = commandTypeAliases[alias] || [alias];
    realTypes.forEach(t => expanded.add(t));
  });
  return expanded;
};
const MINATAUR_API_ADDRESS = "B62qk3SwELMgRYALi8fiQvpqfBs48m3cqCd7o4d5dJUqEQ6mW9gEySm";
const DONATION_ADDRESS = "B62qrZNc5YzuBzSaCPSNRASCkPjKosaj3zYZELM6X5nCsha6rEh6s8F";
let allTimestamps = [];  // 🔁 collected from edges
let currentRange = [0, 0];
let histogramChart;
let isFullscreen = false;
let sidebar;
let details;
let tooltip;
let panel;
let apiTokenInput;
let blockchainSelect;
let tokenInput;
let chain;
let toggleBtn;
let searchDiv;
let searchInput;
let algorithmSelect;
let faSettings;
let ordSettings;
let themeToggleBtn;
let appContainer;
let inputs;
let layoutBtn;
let toggleTokenBtn;
let arrow;
let tokenSection;
let sigmaContainer;
let controls;
let footer;
let fullscreenBtn;
let exitFullscreenBtn;
let slicer;

const knownTokens = {
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { name: "Tether USD", symbol: "USDT", decimals: 6 },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { name: "USD Coin", symbol: "USDC", decimals: 6 },
  "0x6b175474e89094c44da98b954eedeac495271d0f": { name: "Dai Stablecoin", symbol: "DAI", decimals: 18 },
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": { name: "Wrapped Ether", symbol: "WETH", decimals: 18 },
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": { name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8 },
  "0x514910771af9ca656af840dff83e8264ecf986ca": { name: "ChainLink", symbol: "LINK", decimals: 18 },
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": { name: "Aave", symbol: "AAVE", decimals: 18 },
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": { name: "Uniswap", symbol: "UNI", decimals: 18 },
  // Add more as needed
};
document.addEventListener("DOMContentLoaded", () => {
  panel = document.getElementById("side-panel");
  tooltip = document.getElementById("tooltip");
  details = document.getElementById("node-details");
  apiTokenInput = document.getElementById("param-api-token");
  blockchainSelect = document.getElementById("blockchain-select");    
  tokenInput = document.getElementById("param-api-token");
  chain = blockchainSelect.value;
  toggleBtn = document.getElementById("search-icon");
  searchDiv = document.getElementById("searchdiv");
  searchInput = document.getElementById("search-input");
  algorithmSelect = document.getElementById("layout-algorithm");
  faSettings = document.getElementById("forceatlas-settings");
  ordSettings = document.getElementById("openord-settings");
  themeToggleBtn = document.getElementById("theme-toggle-btn");
  sidebar = document.getElementById("left-sidebar");
  appContainer = document.getElementById("app-container");
  // Select all inputs inside the sidebar
  inputs = sidebar.querySelectorAll("input, select, textarea");
  layoutBtn = document.getElementById("layout-toggle-btn");
  toggleTokenBtn = document.getElementById("toggle-token-section");
  arrow = document.getElementById("toggle-token-arrow");
  tokenSection = document.getElementById("minataur-token-section");
  sigmaContainer = document.getElementById("sigma-container");
  controls = document.getElementById("controls");
  footer = document.querySelector("footer");
  fullscreenBtn = document.getElementById("fullscreen-toggle");
  exitFullscreenBtn = document.getElementById("exit-fullscreen-btn");
  slicer = document.getElementById("date-slicer-container");

  

  
  tokenInput.addEventListener("focus", () => {
    tokenInput.type = "text";
  });

  tokenInput.addEventListener("blur", () => {
    tokenInput.type = "password";
  });

  document.getElementById("layout-algorithm").addEventListener("change", (e) => {
    const algorithm = e.target.value;
    loadLayoutSettings(algorithm);
  });

  document.getElementById("layout-toggle-btn").addEventListener("click", () => {
    const algorithm = document.getElementById("layout-algorithm").value;
    saveLayoutSettings(algorithm);
  });
    
  document.getElementById("start-graph-btn").addEventListener("click", () => {
    // Read values from input fields
    LIMIT = parseInt(document.getElementById("param-limit").value, 10);
    FIRST_ITERATION_LIMIT = parseInt(document.getElementById("param-first-iteration").value, 10);
    DEPTH = parseInt(document.getElementById("param-depth").value, 10);
    BASE_KEY = document.getElementById("param-base-key").value.trim();
    API_TOKEN = document.getElementById("param-api-token").value.trim();

    // Get the wipe option
    const wipeGraph = document.getElementById("wipe-select").value === "yes";

    // Reset visited keys
    //visitedKeys.clear();

    // Launch the graph builder
    main(DEPTH, wipeGraph).catch(console.error);
    
    // 👉 Hide the sidebar after launching
    const sidebar = document.getElementById("left-sidebar");
    const appContainer = document.getElementById("app-container");
    sidebar.classList.remove("open");
    appContainer.classList.remove("sidebar-open");      
    // 👇 Reposition legend
    updateLegendOffset();      
  });  

  document.getElementById("clear-token-button").addEventListener("click", () => {
    const chain = blockchainSelect.value;
    clearApiToken(chain);
    apiTokenInput.value = "";
  });

  // Load token when blockchain changes
  blockchainSelect.addEventListener("change", () => {
    const chain = blockchainSelect.value;
    apiTokenInput.value = getApiToken(chain);
    loadStartKeyForBlockchain(chain);
  });

  // Save token on change
  apiTokenInput.addEventListener("input", () => {
    const chain = blockchainSelect.value;
    saveApiToken(chain, apiTokenInput.value.trim());
  });

  document.getElementById("param-base-key").addEventListener("input", (e) => {
    const key = e.target.value;
    localStorage.setItem(`start-key-${selectedBlockchain}`, key);
  });
  
  loadFetchParams();
  setupFetchParamListeners();

  apiTokenInput.value = getApiToken(chain);
  loadStartKeyForBlockchain(chain);  

  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.getAttribute('data-command-type');

      if (!type) {
        // Reset filter
        commandTypeFilter.clear();
        console.log("🔄 Filter reset");
      } else {
        const aliases = commandTypeAliases[type] || [type];
        const isActive = aliases.every(t => commandTypeFilter.has(t));

        if (isActive) {
          // Remove all aliases
          aliases.forEach(t => commandTypeFilter.delete(t));
          console.log("❌ Removed aliases:", aliases);
        } else {
          // Add all aliases
          aliases.forEach(t => commandTypeFilter.add(t));
          console.log("✅ Added aliases:", aliases);
        }
      }

      // Update visual state
      document.querySelectorAll('.legend-item').forEach(el => {
        const t = el.getAttribute('data-command-type');
        if (!t) {
          el.classList.remove('active');
          return;
        }

        const aliases = commandTypeAliases[t] || [t];
        const active = aliases.every(type => commandTypeFilter.has(type));
        el.classList.toggle('active', active);
      });

      console.log("🧪 Final filter set:", Array.from(commandTypeFilter));
      renderer.refresh();
    });
  });
  
  document.getElementById("import-json").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      importJSON(file);
    }
  });  
  
  document.getElementById("toggle-labels").addEventListener("change", (e) => {
    showAllLabels = e.target.checked;
    renderer.refresh();
  });
  
  document.getElementById("stop-loading-btn").addEventListener("click", () => {
    cancelRequested = true;
    appendLoaderLog("⚠️ Loading cancelled by user.");
  });
  

 
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent bubbling to the outside click
    const isVisible = searchDiv.style.display === "block";

    if (isVisible) {
      searchDiv.style.display = "none";
    } else {
      searchDiv.style.display = "block";
      searchInput.style.display = "block"; // optional safeguard
      searchInput.focus();
    }
  });

  // Hide on outside click
  document.addEventListener("click", (e) => {
    if (!searchDiv.contains(e.target) && !toggleBtn.contains(e.target)) {
      searchDiv.style.display = "none";
    }
  });
  


  algorithmSelect.addEventListener("change", () => {
    const value = algorithmSelect.value;
    faSettings.style.display = value === "fa" ? "block" : "none";
    ordSettings.style.display = value === "ord" ? "block" : "none";
        });
        
  if (blockchainSelect) {
    // Ensure selectedBlockchain is synced with current value on page load
    selectedBlockchain = blockchainSelect.value;
    console.log("🌐 Initial selected blockchain:", selectedBlockchain);      
    blockchainSelect.addEventListener("change", (e) => {
      selectedBlockchain = e.target.value;
      console.log("🌐 Selected blockchain:", selectedBlockchain);
    });
  }  
 
  function applyTheme(theme) {
    currentTheme = theme;
    const isLight = theme === "light";

    // Update button text
    const iconContainer = document.getElementById("theme-icon");
    iconContainer.innerHTML = isLight
      ? `
        <!-- Sun -->
        <svg viewBox="0 0 24 24" width="24" height="24" style="fill:white;">
          <path fill="black" d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"/>
        </svg>
      `
      : `
        <!-- Moon -->
        <svg viewBox="0 0 24 24" width="24" height="24" style="fill:white;">
          <path fill="white" d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>
        </svg>
      `;

    const searchIconSvg = document.getElementById("search-icon-svg");
    if (searchIconSvg) {
      searchIconSvg.setAttribute("fill", isLight ? "black" : "white");
    }

    // Apply styles only if elements exist
    document.body.style.background = isLight ? "#f5f5f5" : "#000";

    const sidebar = document.getElementById("left-sidebar");
    if (sidebar) {
      sidebar.style.background = isLight ? "#fff" : "#1e1e1e";
      sidebar.style.color = isLight ? "#111" : "#fff";
    }

    const controls = document.getElementById("controls");
    if (controls) {
      controls.style.background = isLight ? "#eee" : "#222";
      controls.style.color = isLight ? "#000" : "#fff";
    }

    const footer = document.getElementById("footer");
    if (footer) {
      footer.style.color = isLight ? "#333" : "#aaa";
      footer.style.borderTop = isLight ? "1px solid #aaa" : "1px solid #333";
    }

    const sigmaContainer = document.getElementById("sigma-container");
    if (sigmaContainer) {
      sigmaContainer.style.background = isLight ? "#fff" : "#000";
    }

    document.querySelectorAll("#left-sidebar input, #controls input").forEach(input => {
      input.style.background = isLight ? "#fff" : "#222";
      input.style.color = isLight ? "#000" : "#fff";
    });

    // Apply to Sigma renderer
    if (typeof renderer !== "undefined") {
      //console.log("Inside applyTheme");
      renderer.setSetting("labelColor", {color: isLightTheme() ? "#000" : "#9999ff"});
      renderer.setSetting("labelBackground", {color: isLightTheme() ? "#fff" : "#000"});
      //console.log(isLight ? "Label Color switched to #000" : "Label Color switched to #fff");
      renderer.setSetting("defaultNodeColor", isLight ? "#444" : "#ccc");
      renderer.setSetting("defaultEdgeColor", isLight ? "#aaa" : "#555");
      renderer.refresh();
      renderer.render();
    }
  }

  themeToggleBtn?.addEventListener("click", () => {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
    setupReducers(); // 👈 Ajout essentiel
    renderer.refresh(); // 👈 Pour forcer le redraw après les nouveaux reducers
    renderer.render();
  });


  applyTheme("dark"); // init


  if (window.innerWidth >= 769) {
    sidebar.classList.add("open"); // 👈 Ajoute cette ligne !
    appContainer.classList.add("sidebar-open");
  }

  if (window.innerWidth >= 769 && sidebar.classList.contains("open")) {
    appContainer.classList.add("sidebar-open");
  } else {
    appContainer.classList.remove("sidebar-open");
  }
  
  inputs.forEach(input => {
    input.addEventListener("focus", () => {
      sidebar.classList.add("open");
      appContainer.classList.add("sidebar-open"); // ✅ Keep it for all screen sizes
    });
  });
  
  /*document.getElementById("menu-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("left-sidebar");
    sidebar.classList.toggle("open");
    const app = document.getElementById("app-container");
    if (window.innerWidth >= 769) {
      if (sidebar.classList.contains("open")) {
        app.classList.add("sidebar-open");
      } else {
        app.classList.remove("sidebar-open");
      }
    }     
  });*/

  document.getElementById("close-panel-btn").addEventListener("click", () => {
    document.getElementById("side-panel").classList.remove("open");
  });
  
  updateSlicerView(); // ⬅️ initial call

  window.addEventListener("resize", updateSlicerView);
  window.addEventListener("DOMContentLoaded", updateSlicerView);   
  window.addEventListener("orientationchange", () => {
    setTimeout(updateSlicerView, 300);
  });


  layoutBtn.addEventListener("click", () => {
    if (isLayoutRunning) {
      stopLayoutInWorker();
      layoutBtn.textContent = "Apply Layout";
      isLayoutRunning = false;
    } else {
      runLayoutInWorker();
      layoutBtn.textContent = "Stop Layout";
      isLayoutRunning = true;
    }
  });  

  toggleTokenBtn?.addEventListener("click", () => {
    const isHidden = tokenSection.style.display === "none";
    tokenSection.style.display = isHidden ? "block" : "none";
    arrow.textContent = isHidden ? "▾" : "▸";
  });

  document.getElementById("connect-auro-btn")?.addEventListener("click", connectAuroAndSend);
  
  adjustSidebarState(); // Appel initial

  // Responsive: surveille resize
  // ✅ Resize Sigma on window resize
  window.addEventListener("resize", () => {
    adjustSidebarState();
    updateLegendOffset();
    if (renderer) {
      renderer.resize();
      renderer.refresh();
    }
  });

  // ✅ Resize Sigma if #sigma-container itself is resized (e.g. flexbox, sidebar toggle, etc.)
  const resizeObserver = new ResizeObserver(() => {
    if (renderer) {
      renderer.resize();
      renderer.refresh();
    }
  });

  if (sigmaContainer) {
    resizeObserver.observe(sigmaContainer);
  }

  /*document.getElementById("menu-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("left-sidebar");
    sidebar.classList.toggle("open");
    const app = document.getElementById("app-container");
    if (window.innerWidth >= 769) {
      if (sidebar.classList.contains("open")) {
        app.classList.add("sidebar-open");
      } else {
        app.classList.remove("sidebar-open");
      }
    }     
  });*/

  document.getElementById("menu-toggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
    appContainer.classList.toggle("sidebar-open");
    updateLegendOffset();
    
    // Give layout time to settle before resizing Sigma
    setTimeout(() => {
      if (renderer) {
        renderer.resize();
        renderer.refresh();
      }
    }, 150);        
  });

  // Close side panel (right panel)
  document.getElementById("close-panel-btn").addEventListener("click", () => {
    document.getElementById("side-panel").classList.remove("open");
  });
  
  document.getElementById("donate-btn").addEventListener("click", sendDonation);


  fullscreenBtn.addEventListener("click", () => toggleFullscreen());
  exitFullscreenBtn.addEventListener("click", () => toggleFullscreen(true));
  window.dispatchEvent(new Event("resize"));  

  const legend = document.getElementById("legend");
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  if (!legend) return;

  legend.style.cursor = "move";
  legend.style.userSelect = "none"; // prevent text selection
  legend.style.touchAction = "none"; // important for touch dragging

  const startDrag = (e) => {
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    offsetX = clientX - legend.offsetLeft;
    offsetY = clientY - legend.offsetTop;
    legend.style.transition = "none";
  };

  const onDrag = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    legend.style.left = `${clientX - offsetX}px`;
    legend.style.top = `${clientY - offsetY}px`;
    if (e.cancelable) e.preventDefault(); // avoid scrolling on touch
  };

  const stopDrag = () => {
    isDragging = false;
    legend.style.transition = "";
  };

  // Mouse events
  legend.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);

  // Touch events
  legend.addEventListener("touchstart", startDrag, { passive: false });
  document.addEventListener("touchmove", onDrag, { passive: false });
  document.addEventListener("touchend", stopDrag);
});

function getKnownTokenInfo(contractAddress) {
  if (!contractAddress) return null;
  return knownTokens[contractAddress.toLowerCase()] || null;
}

function updateLegendOffset() {
  const legend = document.getElementById("legend");
  const appContainer = document.getElementById("app-container");
  const isWideScreen = window.innerWidth >= 769;
  const sidebarOpen = appContainer.classList.contains("sidebar-open");
  const fullscreen = document.body.classList.contains("fullscreen-mode");

  if (isWideScreen && sidebarOpen && !fullscreen) {
    legend.style.left = "330px"; // Sidebar visible
  } else {
    legend.style.left = "50px";  // Sidebar hidden or fullscreen
  }
}

function getContrastingLabelColor(bgColor) {
  if (!bgColor || typeof bgColor !== "string") return currentTheme === "light" ? "#000" : "#fff";

  // Ensure it's a valid 6-digit hex color
  if (!/^#[0-9a-fA-F]{6}$/.test(bgColor)) return currentTheme === "light" ? "#000" : "#fff";

  const r = parseInt(bgColor.substr(1, 2), 16);
  const g = parseInt(bgColor.substr(3, 2), 16);
  const b = parseInt(bgColor.substr(5, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#000" : "#fff";
}

function getDecimalsForBlockchain(chain) {
  switch (chain) {
    case "ethereum":
    case "polygon":
    case "bsc":
    case "solana":
      return 18;
    case "mina":
      return 9;
    default:
      return 18; // Default fallback
  }
}

function formatAmount(amount, decimals = 9) {
  if (!amount) return "-";
  try {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(2);
  } catch (e) {
    return "-";
  }
}

function showLoader() {
  cancelRequested = false;
  document.getElementById("loader-modal").style.display = "flex";
  document.getElementById("loader-log").textContent = "";
}

function hideLoader() {
  document.getElementById("loader-modal").style.display = "none";
}

function appendLoaderLog(message) {
  const logEl = document.getElementById("loader-log");
  const lines = logEl.textContent.trim().split("\n");
  lines.push(message);
  if (lines.length > 10) lines.shift(); // Keep max 10 lines
  logEl.textContent = lines.join("\n");
}

function getColorByName(name) {
  if (!name || name === "noname") return "hsl(300, 100%, 65%)";
  if (!nameColorMap.has(name)) {
    const hue = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    nameColorMap.set(name, `hsl(${hue}, 100%, 60%)`);
  }
  return nameColorMap.get(name);
}

function getBrightColorByName(name) {
  if (!name || name === "noname") return "#F984EF";
  if (!nameColorMap.has(name)) {
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;

    // Convert HSL( hue, 100%, 65% ) to HEX:
    const hex = hslToHex(hue, 100, 65);
    nameColorMap.set(name, hex);
  }
  return nameColorMap.get(name);
}

function getColorByDegree(degree, minDeg, maxDeg) {
  if (maxDeg === minDeg) return "#FFD700"; // Gold if all nodes have same degree
  const ratio = (degree - minDeg) / (maxDeg - minDeg);

  // 🎨 Accentuer les contrastes pour les hauts degrés
  // Teinte allant de 300 (violet) à 330 (rose/jaune)
  const hue = 300 + ratio * 30;

  // Saturation plus élevée pour les nœuds avec beaucoup de liens
  const saturation = 80 + ratio * 20; // de 80% à 100%

  // Luminosité augmentée aussi
  const lightness = 40 + ratio * 40; // de 40% à 80%

  return hslToHex(hue, saturation, lightness);
}


// Converts HSL to HEX
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

  return `#${[f(0), f(8), f(4)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("")}`;
}




function updateLayoutProgressBar(percent) {
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");

  bar.max = 100;
  bar.value = percent;
  text.textContent = percent + "%";
}

function fruchtermanReingold(graph, {
  width = 2000, height = 2000,
  iterations = 5000, gravity = GRAVITY, scalingRatio = SCALINGRATIO
} = {}) {
  const nodes = graph.nodes();
  const positions = {};
  nodes.forEach(n => positions[n] = {
    x: graph.getNodeAttribute(n, 'x') || Math.random() * width,
    y: graph.getNodeAttribute(n, 'y') || Math.random() * height
  });

  for (let iter = 0; iter < iterations && !pause; iter++) {
    const disp = {};
    nodes.forEach(v => {
      disp[v] = { x: 0, y: 0 };
      nodes.forEach(u => {
        if (u !== v) {
          const dx = positions[v].x - positions[u].x;
          const dy = positions[v].y - positions[u].y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
          const rep = scalingRatio * scalingRatio / dist;
          disp[v].x += dx / dist * rep;
          disp[v].y += dy / dist * rep;
        }
      });
    });

    graph.forEachEdge((_, __, src, tgt) => {
      const dx = positions[src].x - positions[tgt].x;
      const dy = positions[src].y - positions[tgt].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const att = dist * dist / scalingRatio;
      const dxNorm = dx / dist * att;
      const dyNorm = dy / dist * att;
      disp[src].x -= dxNorm; disp[src].y -= dyNorm;
      disp[tgt].x += dxNorm; disp[tgt].y += dyNorm;
    });

    nodes.forEach(v => {
      const d = Math.sqrt(disp[v].x ** 2 + disp[v].y ** 2);
      if (d > 0) {
        positions[v].x += (disp[v].x / d) * Math.min(d, 10);
        positions[v].y += (disp[v].y / d) * Math.min(d, 10);
      }
      positions[v].x -= gravity * (positions[v].x - width / 2) * 0.01;
      positions[v].y -= gravity * (positions[v].y - height / 2) * 0.01;
    });
  }

  nodes.forEach(n => {
    graph.setNodeAttribute(n, "x", positions[n].x);
    graph.setNodeAttribute(n, "y", positions[n].y);
  });
}

function applyLayout() {
    const iterations = parseInt(document.getElementById("layout-iterations").value, 10) || 5000;
    const gravity = parseFloat(document.getElementById("layout-gravity").value, 10) || 0.01;
    const scale = parseFloat(document.getElementById("layout-scale").value, 10) || 1000;
    const width = parseInt(document.getElementById("layout-width").value, 10) || 2000;
    const height = parseInt(document.getElementById("layout-height").value, 10) || 2000;        
    
    pause = false;
    
    document.getElementById("layout-info").textContent =
      `▶ Applying layout: gravity=${gravity}, scale=${scale}, width=${width}, height=${height}`;
    
    //console.log(`gravity: ${gravity}`);
    
    let step = 0;

    function runLayoutStep() {
      if (pause || step >= iterations) return;

      fruchtermanReingold(graph, {
        iterations: 1,
        gravity: gravity,
        scalingRatio: scale,
        width: width,
        height: height
      });

      renderer.refresh();
      step++;

      requestAnimationFrame(runLayoutStep);
    }

    requestAnimationFrame(runLayoutStep); // Start loop

    fruchtermanReingold(graph, {
        iterations: 1,
        gravity:  gravity,
        scalingRatio: scale,
        width: width,
        height: height
    });
    renderer.refresh();
    step++;        
};  

function stopLayoutInWorker() {
  if (layoutWorker) {
    layoutWorker.terminate();
    layoutWorker = null;
    isLayoutRunning = false;

    document.getElementById("layout-progress").value = 0;
    document.getElementById("layout-progress-text").textContent = "Stopped";

    console.log("⛔ Layout stopped by user");
    // ✅ Reset previous layout since it's been cancelled
    // 🧠 Correctly track what was actually running
    previousLayout = currentLayout;
    currentLayout = null;
  }
}


function runLayoutInWorker() {
  const iterations = parseInt(document.getElementById("layout-iterations").value) || 5000;
  const gravity = parseFloat(document.getElementById("layout-gravity").value) || 0.01;
  const scale = parseFloat(document.getElementById("layout-scale").value) || 1000;
  const width = parseInt(document.getElementById("layout-width").value) || 2000;
  const height = parseInt(document.getElementById("layout-height").value) || 2000;

  const algorithm = document.getElementById("layout-algorithm").value;
  currentLayout = algorithm; // 🧠 store the currently launched one


  let workerFile;
  // ✅ Define settings first
  const settings = {
    iterations,
    gravity,
    scalingRatio: scale,
    width,
    height,
  };

  switch (algorithm) {
    case "fa":
      workerFile = "forceAtlas.js";
      settings.linLogMode = document.getElementById("layout-linlog")?.checked || false;
      settings.outboundAttractionDistribution = document.getElementById("layout-outbound")?.checked || false;
      break;
    case "ord":
      workerFile = "openOrd.js";
      // Ajoute ici les paramètres spécifiques à OpenOrd si besoin
      settings.edgeWeightInfluence = parseFloat(document.getElementById("layout-ewi")?.value) || 0.0;
      settings.coolingFactor = parseFloat(document.getElementById("layout-cooling")?.value) || 0.95;
      settings.attractionMultiplier = parseFloat(document.getElementById("layout-attraction")?.value) || 0.01;
      settings.repulsionMultiplier = parseFloat(document.getElementById("layout-repulsion")?.value) || 1.0;
      settings.initialClusterCount = parseInt(document.getElementById("layout-clusters")?.value) || 5;
      break;
    case "fr":
    default:
      workerFile = "fruchtermanReingold.js";
      // Aucun paramètre spécifique à ajouter ici
      break;
  }

  console.log(workerFile);

  if (layoutWorker) layoutWorker.terminate();
  isLayoutRunning = false;
  
  // 🧪 Force a refresh baseline before applying new layout
  if (previousLayout === "ord" && algorithm !== "ord") {
    console.log("Resetting positions before switching from OpenOrd to another layout...");
    graph.forEachNode(id => {
      graph.setNodeAttribute(id, "x", Math.random() * 1000 - 500);
      graph.setNodeAttribute(id, "y", Math.random() * 1000 - 500);
    });
    renderer.refresh();
  }
 
  
  layoutWorker = new Worker(`./scripts/${workerFile}`);

  const nodes = graph.nodes().map(id => ({
    id,
    x: graph.getNodeAttribute(id, "x"),
    y: graph.getNodeAttribute(id, "y")
  }));

  const edges = graph.edges().map(id => ({
    source: graph.source(id),
    target: graph.target(id),
    weight: graph.getEdgeAttribute(id, "weight") || 1 // Fallback if undefined
  }));



  layoutWorker.postMessage({ nodes, edges, settings });

  let lastRenderTime = 0;

  layoutWorker.onmessage = function (e) {
    const { type, progress, positions } = e.data;

    if (type === "progress") {
      const percent = Math.round(progress * 100);
      document.getElementById("layout-progress").value = percent;
      document.getElementById("layout-progress-text").textContent = `${percent}%`;

      const now = performance.now();
      if (now - lastRenderTime > 300) { // only update every 300ms
        for (const id in positions) {
            const { x, y } = positions[id];
            if (isNaN(x) || isNaN(y)) {
              console.warn("💥 NaN detected during OpenOrd progress:", id, positions[id]);
            }          
          graph.setNodeAttribute(id, "x", positions[id].x);
          graph.setNodeAttribute(id, "y", positions[id].y);
        }
        renderer.refresh();
        lastRenderTime = now;
      }
    }

    if (type === "done") {
      for (const id in positions) {
        const { x, y } = positions[id];
        if (isNaN(x) || isNaN(y)) {
          console.warn("💥 NaN detected in node position:", id, positions[id]);
        }        
        graph.setNodeAttribute(id, "x", positions[id].x);
        graph.setNodeAttribute(id, "y", positions[id].y);
      }
      renderer.refresh();

      // ✅ Terminate worker to clean up
      if (layoutWorker) {
        layoutWorker.terminate();
        layoutWorker = null;
      }

      // ✅ Reset UI state
      const layoutBtn = document.getElementById("layout-toggle-btn");
      if (layoutBtn) layoutBtn.textContent = "Apply Layout";
      isLayoutRunning = false;
      
      // ✅ Update previousLayout state
      previousLayout = currentLayout;
      currentLayout = null;
    }
  };
}


function updateProgress() {
  const bar = document.getElementById("progress-bar");
  bar.max = totalSteps;
  bar.value = currentStep;
}

function showErrorPopup(message) {
  const popup = document.getElementById("error-popup");
  const msgBox = document.getElementById("error-message");
  msgBox.textContent = message;
  popup.style.display = "block";
}

async function log_api_call (bc) {
  const res = await fetch(`https://www.akirion.com:4664/proxy?url=https://webapp.minagraph.com/api/log.json?bc=${bc}`, {
      method: "GET",
      headers: {
          'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
          "Content-Type": "application/json"
      }
  });
  
  if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
} 


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getSolCommandType(tx) {
  const instructions = tx.transaction.message.instructions || [];

  for (const inst of instructions) {
    // Handle parsed instructions (system, token, etc.)
    if (inst.parsed?.type) {
      const type = inst.parsed.type.toLowerCase();

      if (inst.program === "system" && type === "transfer") return "transfer";
      if (inst.program === "spl-token" && type === "transfer") return "token_transfer";
      if (inst.program === "stake") return "stake";
      if (inst.program === "vote") return "vote";
      if (inst.program === "memo") return "memo";
    }

    // Handle raw programId-based logic
    const programId = inst.programId;
    if (programId === "11111111111111111111111111111111") return "transfer"; // system
    if (programId.startsWith("Tokenkeg")) return "token_transfer"; // SPL Token Program
    if (programId.startsWith("Stake111")) return "stake";
    if (programId.startsWith("Vote111")) return "vote";
    if (programId.startsWith("MemoSq4")) return "memo";
    if (programId.startsWith("BPFLoader")) return "contract_deploy";
    if (programId.startsWith("metaqb")) return "nft_mint";
    if (programId.startsWith("cmtDvXum")) return "nft_collection";
    if (programId.startsWith("9xQeW")) return "serum_order"; // Serum DEX
    if (programId.startsWith("RVKd61")) return "raydium_swap";
  }

  return "contract_call"; // fallback
}


async function fetchTransactionsForKey(publicKey, blockchain = selectedBlockchain, delay = 0) {
    const normalizedKey = blockchain === "polygon" ? publicKey.toLowerCase() : publicKey;
    
    if (normalizedKey === "genesis") 
      return;
    
    delay = delayByBlockchain[blockchain] || delay;
    console.log("selectedBlockchain : ", selectedBlockchain);
    console.log("Normalized Key : ", normalizedKey);

    if (visitedKeys.has(normalizedKey)) return [];
    visitedKeys.add(normalizedKey);

    const limit = (normalizedKey === BASE_KEY) ? FIRST_ITERATION_LIMIT : LIMIT;

    try {
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        let transactions = [];

        if (blockchain === 'mina') {
            const res = await fetch("https://www.akirion.com:4664/proxy?url=https://minataur.net/api/v1/transactions", {
                method: "POST",
                headers: {
                    "Minataur-Authorization": API_TOKEN,
                    'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ publicKey: normalizedKey, limit })
            });
            
            console.log("Calling Minataur API");

            if (!res.ok) {
                throw new Error(`Minataur API error: ${res.status} ${res.statusText}`);
            }

            const json = await res.json();

            if (!json || !json.payload || !json.payload.transactions) {
                throw new Error("Unexpected response format from Minataur API");
            }

            transactions = Array.from(new Map((json.payload.transactions || []).map(tx => [tx.hash, tx])).values());

            transactions.forEach(tx => {
              tx.blockchain = 'mina';
              // 🔵 New fields added for ERC-20 Tokens
              tx.token_contract = null;
              tx.token_receiver = null;
              tx.token_amount = null;                                   
              tx.token_name = null,
              tx.token_decimals = null
            });


        } else if (blockchain === 'polygon') {
            const polygonscanApiKey = API_TOKEN;
            const url = `https://api.polygonscan.com/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${polygonscanApiKey}`;

            console.log("Calling Polygonscan API");

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`PolygonScan API error: ${res.status} ${res.statusText}`);
            }

            const json = await res.json();
            if (!json || json.status !== "1" || !json.result) {
                throw new Error("Unexpected response format from PolygonScan API");
            }

            log_api_call (blockchain);

            transactions = json.result.map(tx => {
              const isContractCreation = !tx.to; // ✅ Now tx is defined

              return {
                blockchain: blockchain,
                block_id: parseInt(tx.blockNumber),
                height: parseInt(tx.blockNumber),
                timestamp: `${parseInt(tx.timeStamp) * 1000}`,
                hash: tx.hash,
                command_type: tx.input && tx.input !== "0x" ? "contract_call" : "transfer",
                nonce: tx.nonce,
                amount: tx.value,
                fee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
                memo: "",
                sequence_no: null,
                status: tx.isError === "0" ? "applied" : "failed",
                failure_reason: tx.isError === "0" ? null : "error",
                confirm: null,
                sender_id: null,
                sender_key: tx.from.toLowerCase(),
                receiver_key: isContractCreation ? tx.from.toLowerCase() : tx.to.toLowerCase(),
                sender_name: "noname",
                receiver_id: null,
                receiver_name: isContractCreation ? "contract_creation" : "noname",
                fee_payer_id: null,
                fee_payer_key: tx.from.toLowerCase(),
                fee_payer_name: null,
                chain_status: "canonical",
                block_hash: tx.blockHash,
                r_thief: 0,
                s_thief: 0,
                r_scammer: 0,
                s_scammer: 0,
                r_spammer: 0,
                s_spammer: 0,
                // 🔵 New fields added for ERC-20 Tokens
                token_contract: null,
                token_receiver: null,
                token_amount: null,
                token_name: null,
                token_decimals: null
              };
            });
        } else if (blockchain === 'ethereum') {
            const etherscanApiKey = API_TOKEN;
            const url = `https://api.etherscan.com/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${etherscanApiKey}`;

            console.log("Calling Etherscan API");

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Etherscan API error: ${res.status} ${res.statusText}`);
            }

            const json = await res.json();
            if (!json || json.status !== "1" || !json.result) {
                throw new Error("Unexpected response format from EtherScan API");
            }

            log_api_call (blockchain);
            
            transactions = json.result.map(tx => {
              const isContractCreation = !tx.to; // ✅ Now tx is defined
              const isTokenTransfer = tx.input && tx.input.startsWith("0xa9059cbb"); // methodId = ERC20 transfer
              let tokenReceiver = null;
              let tokenAmount = null;
              let tokenName = null;
              let tokenDecimals = null;              
              
              if (isTokenTransfer && tx.input.length >= 138) { // "0x" + 8 + 64 + 64 chars
                  try {
                      tokenReceiver = "0x" + tx.input.slice(34, 74); // 20 bytes address
                      tokenAmount = BigInt("0x" + tx.input.slice(74, 138)).toString(); // uint256 amount
                      const tokenInfo = getKnownTokenInfo(tx.to);
                      if (tokenInfo) {
                        tokenName = tokenInfo.symbol;    // Example: USDT
                        tokenDecimals = tokenInfo.decimals; // Example: 6
                      }
                  } catch (err) {
                      console.warn(`Failed to parse ERC20 input for tx ${tx.hash}`);
                  }
              }              

              return {
                blockchain: blockchain,
                block_id: parseInt(tx.blockNumber),
                height: parseInt(tx.blockNumber),
                timestamp: `${parseInt(tx.timeStamp) * 1000}`,
                hash: tx.hash,
                command_type: isTokenTransfer ? "token_transfer" : (tx.input && tx.input !== "0x" ? "contract_call" : "transfer"),
                nonce: tx.nonce,
                amount: tx.value,
                fee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
                memo: "",
                sequence_no: null,
                status: tx.isError === "0" ? "applied" : "failed",
                failure_reason: tx.isError === "0" ? null : "error",
                confirm: null,
                sender_id: null,
                sender_key: tx.from.toLowerCase(),
                receiver_key: isContractCreation ? tx.from.toLowerCase() : tx.to.toLowerCase(),
                sender_name: "noname",
                receiver_id: null,
                receiver_name: isContractCreation ? "contract_creation" : "noname",
                fee_payer_id: null,
                fee_payer_key: tx.from.toLowerCase(),
                fee_payer_name: null,
                chain_status: "canonical",
                block_hash: tx.blockHash,
                r_thief: 0,
                s_thief: 0,
                r_scammer: 0,
                s_scammer: 0,
                r_spammer: 0,
                s_spammer: 0,
                
                // 🔵 New fields added for ERC-20 Tokens
                token_contract: isTokenTransfer ? tx.to.toLowerCase() : null,
                token_receiver: tokenReceiver ? tokenReceiver.toLowerCase() : null,
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals
              };
            });
        } else if (blockchain === 'bsc') {
            if (normalizedKey === 'genesis')
              return;
            const bscscanApiKey = API_TOKEN;
            //const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${bscscanApiKey}`;
            
            const encodedTargetUrl = encodeURIComponent(
              `https://api.bscscan.com/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${bscscanApiKey}`
            );

            const url = `https://www.akirion.com:4664/proxy?url=${encodedTargetUrl}`;
        

            console.log("Calling BSC API");

            const res = await fetch(url, {
            headers: {
                    'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
                    "Content-Type": "application/json"
                },
            });
            
            if (!res.ok) {
                throw new Error(`BSCScan API error: ${res.status} ${res.statusText}`);
            }

            const json = await res.json();
            if (!json || json.status !== "1" || !json.result) {
                throw new Error("Unexpected response format from BSCScan API");
            }

            log_api_call (blockchain);

            transactions = json.result.map(tx => {
              const isContractCreation = !tx.to; // ✅ Now tx is defined

              return {
                blockchain: blockchain,
                block_id: parseInt(tx.blockNumber),
                height: parseInt(tx.blockNumber),
                timestamp: `${parseInt(tx.timeStamp) * 1000}`,
                hash: tx.hash,
                command_type: tx.input && tx.input !== "0x" ? "contract_call" : "transfer",
                nonce: tx.nonce,
                amount: tx.value,
                fee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
                memo: "",
                sequence_no: null,
                status: tx.isError === "0" ? "applied" : "failed",
                failure_reason: tx.isError === "0" ? null : "error",
                confirm: null,
                sender_id: null,
                sender_key: tx.from.toLowerCase(),
                receiver_key: isContractCreation ? tx.from.toLowerCase() : tx.to.toLowerCase(),
                sender_name: "noname",
                receiver_id: null,
                receiver_name: isContractCreation ? "contract_creation" : "noname",
                fee_payer_id: null,
                fee_payer_key: tx.from.toLowerCase(),
                fee_payer_name: null,
                chain_status: "canonical",
                block_hash: tx.blockHash,
                r_thief: 0,
                s_thief: 0,
                r_scammer: 0,
                s_scammer: 0,
                r_spammer: 0,
                s_spammer: 0,
                // 🔵 New fields added for ERC-20 Tokens
                token_contract: null,
                token_receiver: null,
                token_amount: null,
                token_name: null,
                token_decimals: null                
              };
            });
        } else if (blockchain === 'solana') {
        
        // ======== SOLANA =========
          console.log("Calling Helius Solana API");

          const HELIUS_API_KEY = API_TOKEN;
          const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

          const signaturesPayload = {
            jsonrpc: "2.0",
            id: 1,
            method: "getSignaturesForAddress",
            params: [
              normalizedKey,
              { limit: limit }
            ]
          };

          const signaturesRes = await fetch(url, {
            method: "POST",
            headers: {
              'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
              "Content-Type": "application/json"
            },
            body: JSON.stringify(signaturesPayload)
          });

          if (!signaturesRes.ok) {
            throw new Error(`Helius API error: ${signaturesRes.status} ${signaturesRes.statusText}`);
          }

          const signaturesJson = await signaturesRes.json();

          if (!signaturesJson || !signaturesJson.result) {
            throw new Error("Unexpected response format from Helius API");
          }
          
          console.log("signaturesJson : ", signaturesJson);

          appendLoaderLog(`🔄 Loading ${signaturesJson.result.length} tx for ${normalizedKey.slice(0, 6)}…${normalizedKey.slice(-6)}`);

          const txDetails = [];

          for (const sig of signaturesJson.result) {
            const txPayload = {
              jsonrpc: "2.0",
              id: 1,
              method: "getTransaction",
              params: [
                sig.signature,
                {
                  encoding: "jsonParsed",
                  maxSupportedTransactionVersion: 0
                }
              ]
            };

            const txRes = await fetch(url, {
              method: "POST",
              headers: {
                'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
                "Content-Type": "application/json"
              },
              body: JSON.stringify(txPayload)
            });

            if (txRes.ok) {
              const txJson = await txRes.json();
              if (txJson && txJson.result) {
                txDetails.push(txJson.result);
              }
            }

            await sleep(delay);
          }

          log_api_call(blockchain);

          transactions = txDetails
            .filter(tx => tx !== null)
            .map(tx => {
              const accountKeys = tx.transaction.message.accountKeys;
              const senderKey = accountKeys[0].pubkey;

              let receiverKey = senderKey;
              if (tx.meta && tx.meta.postTokenBalances && tx.meta.postTokenBalances.length > 0) {
                const tokenRecipient = accountKeys[tx.meta.postTokenBalances[0].accountIndex];
                receiverKey = tokenRecipient.pubkey;
              } else if (accountKeys.length > 1) {
                receiverKey = accountKeys[1].pubkey;
              }

              return {
                tx,
                senderKey,
                receiverKey
              };
            })
            .filter(({ senderKey, receiverKey }) =>
              senderKey === normalizedKey || receiverKey === normalizedKey
            )
            .map(({ tx, senderKey, receiverKey }) => {
              const commandType = getSolCommandType(tx);
              
              const accountKeys = tx.transaction.message.accountKeys;

              let amount = "0";
              if (tx.meta && tx.meta.preBalances && tx.meta.postBalances) {
                const receiverIndex = accountKeys.findIndex(k => k.pubkey === receiverKey);
                if (receiverIndex >= 0) {
                  const pre = tx.meta.preBalances[receiverIndex] || 0;
                  const post = tx.meta.postBalances[receiverIndex] || 0;
                  if (post - pre > 0) {
                    amount = (post - pre).toString();
                  }
                }
              }

              return {
                blockchain: blockchain,
                block_id: tx.slot,
                height: tx.slot,
                timestamp: tx.blockTime ? `${tx.blockTime * 1000}` : null,
                hash: tx.transaction.signatures[0],
                command_type: commandType,
                nonce: null,
                amount: amount,
                fee: tx.meta?.fee?.toString() || "0",
                memo: "",
                sequence_no: null,
                status: tx.meta?.err ? "failed" : "applied",
                failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
                confirm: null,
                sender_id: null,
                sender_key: senderKey,
                receiver_key: receiverKey,
                sender_name: "noname",
                receiver_id: null,
                receiver_name: "noname",
                fee_payer_id: null,
                fee_payer_key: senderKey,
                fee_payer_name: null,
                chain_status: "canonical",
                block_hash: tx.slot,
                r_thief: 0,
                s_thief: 0,
                r_scammer: 0,
                s_scammer: 0,
                r_spammer: 0,
                s_spammer: 0,
                // 🔵 New fields added for ERC-20 Tokens
                token_contract: null,
                token_receiver: null,
                token_amount: null,
                token_name: null,
                token_decimals: null
              };
            });
        }

        console.log(transactions);

        currentStep++;
        updateProgressBar(currentStep, totalSteps);
        return transactions;

    } catch (error) {
        cancelRequested = true;
        hideLoader();
        showErrorPopup(error.message || "An unknown error occurred");
        throw error;
    }
}

async function buildGraphRecursively(publicKey, depth, level = 0) {
  const normalizedKey = ["polygon", "ethereum", "bsc"].includes(selectedBlockchain)
    ? publicKey.toLowerCase()
    : publicKey;
    
  if (normalizedKey === "genesis")
    return;
    
  if (!window.initialPublicKey) {
    window.initialPublicKey = normalizedKey;
  }
    
  if (depth < 0 || visitedKeys.has(normalizedKey) || cancelRequested) return;
  while (pause) await new Promise(r => setTimeout(r, 100));
  const transactions = await fetchTransactionsForKey(normalizedKey,selectedBlockchain,1000);

  transactionsByNeighbor[normalizedKey] = transactions; // ✅ ici

  appendLoaderLog(`🔄 Loaded ${transactions.length} tx for ${normalizedKey.slice(0, 6)}…${normalizedKey.slice(-6)} at depth ${level}`);


  for (const tx of transactions) {
    const sender = tx.sender_key;
    const receiver = tx.receiver_key;
    const senderName = tx.sender_name;
    const receiverName = tx.receiver_name;

    if (!graph.hasNode(sender)) {
      graph.addNode(sender, {
        label: `${senderName !== "noname" ? senderName : "Sender"} (${sender.slice(0, 6)}…${sender.slice(-6)})`,
        name: senderName,
        color: getBrightColorByName(senderName),
        x: Math.random() * 1000, // ← assure une position aléatoire
        y: Math.random() * 1000
      });
    }

    if (!graph.hasNode(receiver)) {
      graph.addNode(receiver, {
        label: `${receiverName !== "noname" ? receiverName : "Receiver"} (${receiver.slice(0, 6)}…${receiver.slice(-6)})`,
        name: receiverName,
        color: getBrightColorByName(receiverName),
        x: Math.random() * 1000,
        y: Math.random() * 1000
      });
    }

    const edgeId = tx.hash || `${sender}-${receiver}-${tx.nonce}`;
    if (!graph.hasEdge(edgeId)) {
      const timestamp = parseInt(tx.timestamp); // parse to ensure it's a number
      graph.addEdgeWithKey(edgeId, sender, receiver, {
        label: tx.command_type,
        status: tx.status,
        timestamp: timestamp,
        fee: tx.fee,
        amount: tx.amount,
        block_id: tx.block_id,
        block_hash: tx.block_hash,
        memo: tx.memo,
        blockchain: tx.blockchain, // ✅ This is critical,
        token_contract: tx.token_contract,
        token_receiver: tx.token_receiver,
        token_amount: tx.token_amount,        
        token_name: tx.token_name,
        token_decimals: tx.token_decimals,
        color: tx.status === "applied" ? "#ccc" : "#f66"
      });
    }
  }

  // 🎨 Set node color by degree for Ethereum/Polygon
  if (["polygon", "ethereum", "bsc","solana"].includes(selectedBlockchain)) {
    const degrees = graph.nodes().map(n => graph.degree(n));
    const minDeg = Math.min(...degrees);
    const maxDeg = Math.max(...degrees);

    graph.forEachNode((node) => {
      const degree = graph.degree(node);
      const color = getColorByDegree(degree, minDeg, maxDeg);
      //console.log(degree," : ",color);
      graph.setNodeAttribute(node, 'colorByDegree', color);
    });
  } else if (selectedBlockchain === "mina") {
    graph.forEachNode((node) => {
      const name = graph.getNodeAttribute(node, 'name') || "noname";
      const color = getBrightColorByName(name);
      graph.setNodeAttribute(node, 'colorByDegree', color);
    });
  }

  const newReceivers = [...new Set(transactions.map(t => t.receiver_key))];
  totalSteps += newReceivers.length;
  updateProgressBar(currentStep, totalSteps);

  for (const r of newReceivers) {
    if (cancelRequested) break;
    await buildGraphRecursively(r, depth - 1, level + 1);
  }
}

function applyNodeSizesByDegree() {
  graph.forEachNode(node => {
    const degree = graph.degree(node);
    graph.setNodeAttribute(node, "size", 4 + Math.sqrt(degree));
  });
}

function animateLayout(iterations = 500) {
  for (let i = 0; i < iterations; i++) {
    setTimeout(() => {
      fruchtermanReingold(graph, { iterations: 1 });
      renderer.refresh();
    }, i * 20);
  }
}

function deleteSelectedNode(nodeId) {
  const panel = document.getElementById("side-panel");
  
  if (!graph.hasNode(nodeId)) return;
  const layoutBtn = document.getElementById("layout-toggle-btn");

  if (isLayoutRunning) {
    stopLayoutInWorker();
    layoutBtn.textContent = "Apply Layout";
    isLayoutRunning = false;
  }

  const neighbors = graph.neighbors(nodeId);
  const toDelete = new Set([nodeId]); // Start with selected node

  neighbors.forEach(neighbor => {
    const neighborEdges = graph.edges(neighbor);
    let connectedOutside = false;

    for (const edge of neighborEdges) {
      const other = graph.source(edge) === neighbor ? graph.target(edge) : graph.source(edge);
      if (other !== nodeId && !toDelete.has(other)) {
        connectedOutside = true;
        break;
      }
    }

    if (!connectedOutside) {
      toDelete.add(neighbor);
    }
  });

  // Drop all nodes marked for deletion
  toDelete.forEach(n => {
    if (graph.hasNode(n)) graph.dropNode(n);
  });

  selectedNode = null;
  panel.style.display = "none";
  renderer.refresh();
}

function updateProgressBar(step, max) {
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");
  bar.max = max;
  bar.value = step;
  text.textContent = `${Math.round((step / max) * 100)}%`;
}

function isLightTheme() {
  return currentTheme === "light";
}

function formatTimestamp(timestamp) {
  var t = Number(timestamp);
  if (isNaN(t)) return "-";
  var date = new Date(t);
  if (isNaN(date.getTime())) return "-";
  return date.toISOString().replace(/:\d{2}\.\d{3}Z$/, "Z");
}

function formatTokenAmount(amount, decimals = 18) {
  if (!amount) return "0";
  const divisor = BigInt(10) ** BigInt(decimals);
  const value = (BigInt(amount) * BigInt(10000)) / divisor; // keep 4 decimals
  return (Number(value) / 10000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 });
}


function showNodePanel(node) {
  //rebuildTransactionsByNeighbor();
  const panel = document.getElementById("side-panel");
  const data = graph.getNodeAttributes(node);
  const neighbors = graph.neighbors(node);
  
  document.getElementById("side-panel").classList.add("open");
  
  selectedNode = node; // Ensure selection from side panel works too

  let tx = 0, del = 0, failed = 0, sc = 0, tt = 0;
  graph.forEachEdge((e, attr, src, tgt) => {
    if ((src === node || tgt === node)) {
      if (attr.status !== "applied") failed++;
      else if (attr.label === "delegation") del++;
      else if (attr.label === "payment" || attr.label === "transfer") tx++;
      else if (attr.label === "contract_call") sc++;
      else if (attr.label === "token_transfer") tt++;
    }
  });

  //console.log('transactionsByNeighbor keys:', Object.keys(transactionsByNeighbor));
  //console.log('Looking for node:', node);
  //neighbors.forEach(n => {
  //  console.log('Looking for neighbor:', n);
  //});
  
  const html = `
    <h3>
      <a href="${getExplorerURL('account', node, selectedBlockchain)}" target="_blank" style="color:#4fc3f7">
        ${data.label}
      </a>
    </h3>      
    <button onclick="deleteSelectedNode('${node}')" style="
      margin: 5px 0;
      background: #e53935;
      color: white;
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
    ">🗑️ Delete this node from the Graph</button>         
    <p><strong>Key:</strong> <span style="font-size: 10px;">${node}</span></p>
    <p><strong>Degree:</strong> ${graph.degree(node)}</p>
    <p><strong>#Transactions:</strong> ${tx}</p>
    <p><strong>#Delegations:</strong> ${del}</p>
    <p><strong>#Smart Contracts:</strong> ${sc}</p>
    <p><strong>#Token Transfers:</strong> ${tt}</p>
    <p><strong>#Failed Transactions:</strong> ${failed}</p>
    <p><strong>Linked Nodes & Transactions:</strong></p>
    <div>
      ${neighbors.map(n => {
        const label = graph.getNodeAttribute(n, 'label');

        // Transactions initiées par le voisin vers le nœud sélectionné
        /*const fromNeighbor = (transactionsByNeighbor[n.toUpperCase()] || []).filter(tx =>
          (tx.sender_key.toUpperCase() === n.toUpperCase() && tx.receiver_key.toUpperCase() === node.toUpperCase()) ||
          (tx.receiver_key.toUpperCase() === n.toUpperCase() && tx.sender_key.toUpperCase() === node.toUpperCase())
        );*/
        
        const fromNeighbor = (transactionsByNeighbor[n] || []).filter(tx =>
          tx.sender_key === n && tx.receiver_key === node ||
          tx.receiver_key === n && tx.sender_key === node
        );

        //console.log('node:', node);
        //console.log('transactionsByNeighbor[node]:', transactionsByNeighbor[node]);

        // Transactions initiées par le nœud sélectionné vers ce voisin
        /*const fromNode = (transactionsByNeighbor[node.toUpperCase()] || []).filter(tx =>
          (tx.sender_key.toUpperCase() === n.toUpperCase() && tx.receiver_key.toUpperCase() === node.toUpperCase()) ||
          (tx.receiver_key.toUpperCase() === n.toUpperCase() && tx.sender_key.toUpperCase() === node.toUpperCase())
        );*/
        
        const fromNode = (transactionsByNeighbor[node] || []).filter(tx =>
          tx.sender_key === n && tx.receiver_key === node ||
          tx.receiver_key === n && tx.sender_key === node
        );

        //console.log(fromNode);

        // Concatène et déduplique (via hash par exemple si dispo)
        const interactions = [...fromNeighbor, ...fromNode];
        const unique = Array.from(new Map(interactions.map(tx => [tx.hash, tx])).values());

        const txTable = unique.length > 0 ? `
          <table style="width:100%; border-collapse: collapse; font-size: 8px; margin-bottom: 20px;">
            <thead>
              <tr>
                <th>Chain</th>
                <th style="text-align:left;">Timestamp</th>
                <th>Block</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Status</th>
                <!--<th>Chain</th>-->
              </tr>
            </thead>
            <tbody>
              ${unique.map(tx => `
                <tr title="${tx.memo || ''}">
                  <td>${tx.blockchain}</td>
                  <td>${formatTimestamp(tx.timestamp)}</td>
                  <td>
                    ${tx.block_id
                      ? `<a href="${getExplorerURL('block', tx.block_hash, tx.blockchain)}" target="_blank" rel="noopener noreferrer" style="color: white; text-decoration: none;">
                          ${tx.block_id}
                        </a> <span style="font-size: 9px; opacity: 0.7;">🔗</span>`
                      : "-"}
                  </td>                    
                  <td>
                    <a href="${getExplorerURL('transaction', tx.hash, tx.blockchain)}" target="_blank" rel="noopener noreferrer" style="color: white; text-decoration: none;">
                      ${tx.command_type || tx.label || "-"} <span style="font-size: 9px; opacity: 0.7;">🔗</span>
                    </a>
                  </td>
                  <td>${formatAmount(tx.amount, getDecimalsForBlockchain(tx.blockchain))}</td>
                  <td>${formatAmount(tx.fee, getDecimalsForBlockchain(tx.blockchain))}</td>
                  <td>${tx.status || "-"}</td>
                </tr>

                ${tx.command_type === "token_transfer" ? `
                  <tr style="opacity: 0.7;">
                    <td></td>
                    <td colspan=2 style="text-align: right;">
                        Receiver : ${(tx.token_receiver ? `${tx.token_receiver.slice(0,6)}...${tx.token_receiver.slice(-6)}` : "unknown receiver")}
                    </td>
                    <td colspan=4 style="text-align: right;">
                        ${tx.token_amount ? formatTokenAmount(tx.token_amount, tx.token_decimals || 6) : "-"} ${tx.token_name ? tx.token_name : "N/A"}
                    </td>
                  </tr>
                ` : ""}
                `).join("")}
            </tbody>
          </table>
        ` : `<p style="color:#888; margin-bottom: 16px;">No direct interactions.</p>`;

        return `
          <div style="margin-bottom: 20px;">
            <div class="linked-node" onclick="showNodePanel('${n}')">${label}</div>
            <div class="mono">
              ${txTable}
            </div>
          </div>
        `;
      }).join('')}
    </div>`;
    
  details.innerHTML = html;
  panel.style.display = "flex";
  document.getElementById("date-slicer-container").classList.add("on-left");

  renderer.refresh(); // ✅ ensures selection is visible immediately
}

function initRenderer() {
  const container = document.getElementById("sigma-container");
  
  // ⛔ Block init if container is not visible
  if (!container.offsetWidth || !container.offsetHeight) {
    console.warn("Sigma container not ready. Retrying in 100ms...");
    setTimeout(initRenderer, 100); // retry later
    return;
  }    
  
  graph = new Graph({ multi: true });
  //console.log("Dans InitRenderer - isLightTheme = " + isLightTheme())
  param = {labelColor: {color: isLightTheme() ? "#000" : "#9999ff"}}
  
  //renderer = new Sigma(graph, container);

  renderer = new Sigma(graph,container,param);

  // Re-apply settings and listeners
  setupReducers();
  setupInteractions();
  setupSearch();
}

function setupReducers() {
  // 🔢 Precompute min/max degree for color gradient (used only for Polygon & Ethereum & BSC)
  let minDegree = Infinity;
  let maxDegree = -Infinity;

  if (selectedBlockchain === "polygon" || selectedBlockchain === "ethereum" || selectedBlockchain === "bsc" || selectedBlockchain === "solana") {
    graph.forEachNode(node => {
      const deg = graph.degree(node);
      if (deg < minDegree) minDegree = deg;
      if (deg > maxDegree) maxDegree = deg;
    });
  }
  
  renderer.setSetting("nodeReducer", (node, data) => {
    const focusNode = hoveredNode || selectedNode;
    const neighbors = focusNode ? new Set(graph.neighbors(focusNode)) : null;
    const isFocus = focusNode === node;
    const isNeighbor = neighbors?.has(node);
    //console.log("getBrightColorByName " + data.name); 
    //const glowColor =  getBrightColorByName(data.name || "noname");
    //const glowColor =  data.color;
    

    // 🖌️ Use color from degree for Polygon & Ethereum, or name-based color for Mina
    // 🖌️ Use color from degree for Polygon & Ethereum, or name-based color for Mina
    const isMina = selectedBlockchain === "mina";
    let glowColor;

    if (node === window.initialPublicKey) {
      glowColor = "#FF0000"; // 🔥 Rouge pour la clé initiale
    } else {
      glowColor = isMina
        ? getBrightColorByName(data.name || "noname")
        : getColorByDegree(graph.degree(node), minDegree, maxDegree);
    }

    
    const defaultSize = data.size || 5;
    //console.log("Dans nodeReducer - isLightTheme = " + isLightTheme())


    // 🎯 Filter by command type
    const visibleTypes = expandedCommandTypeFilter();

    if (visibleTypes.size > 0) {
      const hasVisibleEdge = graph.edges(node).some(e => {
        const command = graph.getEdgeAttribute(e, "command_type") || graph.getEdgeAttribute(e, "label");
        return visibleTypes.has(command);
      });

      if (!hasVisibleEdge) {
        return {
          ...data,
          color: isLightTheme() ? "#eee" : "#111",
          label: "",
          labelSize: 36,
          hidden: false,
          opacity: 0.05,
          size: defaultSize * 0.1, //* 0.7,
          borderSize: 0,
          zIndex: 0
        };
      }
    }

    // ✨ Focus or neighbor styling
    if (focusNode) {
      if (isFocus) {
        //console.log ("Node Focused");
        return {
          ...data,
          type: "circle",
          color: glowColor,
          overrideColor: glowColor, // 🟢 force Sigma to use this color
          label: data.label,
          labelSize: 36,
          labelColor: {color: "#000"},
          forceLabelColor: true,
          //labelBackground: {
          //  color: currentTheme === "light" ? "#000" : "#fff",
          //  opacity: 0.6,
          //  padding: 3,
          //  borderRadius: 4,
          //},  
          //forceLabelBackground: true,
          zIndex: 2,
          size: defaultSize * 2.2,
          borderColor: glowColor,
          borderSize: 6,
          opacity: 0.9,
        };
      }

      if (isNeighbor) {
        return {
          ...data,
          type: "circle",
          color: glowColor,
          overrideColor: glowColor, // 🟢 force Sigma to use this color
          label: showAllLabels ? data.label : "",
          labelSize: 36,
          // 👇 Force label color
          labelColor: {color: isLightTheme() ? "#000" : "#fff"},
          forceLabelColor: true,
          labelBackground: {
            color: currentTheme === "light" ? "#000" : "#fff",
            opacity: 0.6,
            padding: 3,
            borderRadius: 4,
          },  
          forceLabelBackground: true,                
          zIndex: 1,
          size: defaultSize * 1.5,
          borderColor: glowColor,
          borderSize: 4,
          opacity: 0.5,
        };
      }

      // Dim unrelated nodes
      return {
        ...data,
        color: isLightTheme() ? "#eee" : "#111",
        labelColor: {color: isLightTheme() ? "#000" : "#fff"},
        label: "",
        labelSize: 36,
        size: defaultSize * 0.7,
        opacity: 0.1,
        borderSize: 0,
        zIndex: 0
      };
    }

    // 🧩 Default view
    return {
      ...data,
      color: glowColor,
      overrideColor: glowColor, // 🟢 force Sigma to use this color
      borderColor: glowColor,
      borderSize: 4,
      opacity: 0.75,
      label: showAllLabels ? data.label : "",
      // 👇 Force label color
      labelColor: {color: isLightTheme() ? "#000" : "#fff"},
      forceLabelColor: true,
      //labelBackground: {
      //  color: currentTheme === "light" ? "#000" : "#fff",
      //  opacity: 0.6,
      //  padding: 3,
      //  borderRadius: 4,
      //},
      labelSize: 36,
      //forceLabelBackground: true,          
      size: defaultSize,
      zIndex: 1
    };
  });
  
  renderer.setSetting("defaultNodeColor", "#fff"); // or any default fallback


  renderer.setSetting("edgeReducer", (edge, data) => {
    const focusNode = hoveredNode || selectedNode;
    const command = data.command_type || data.label;
    //console.log("Dans edgeReducer - isLightTheme = " + isLightTheme())
    let baseColor = "#666";
    switch (command) {
      case "payment": baseColor = "#4caf50"; break;
      case "transfer": baseColor = "#4caf50"; break;
      case "delegation": baseColor = "#2196f3"; break;
      case "zkapp": baseColor = "#ff57c1"; break;
      case "contract_call": baseColor = "#ff57c1"; break;
      case "token_transfer": baseColor = "#f9a825"; break;
    }

    // 🧊 Filter edges
    const visibleTypes = expandedCommandTypeFilter();
    if (visibleTypes.size > 0 && !visibleTypes.has(command)) {
      return {
        ...data,
        color: isLightTheme() ? "#eee" : "#111",
        size: 0.3,
        opacity: 0.05,
        zIndex: 0
      };
    }

    if (focusNode) {
      const source = graph.source(edge);
      const target = graph.target(edge);
      const neighbors = new Set(graph.neighbors(focusNode));

      const isFocusEdge =
        (source === focusNode && neighbors.has(target)) ||
        (target === focusNode && neighbors.has(source));

      if (isFocusEdge) {
        return {
          ...data,
          color: baseColor,
          size: 1.5,
          opacity: 0.6,
          zIndex: 2
        };
      } else {
        return {
          ...data,
          color: isLightTheme() ? "#eee" : "#111",
          size: 0.4,
          opacity: 0.1,
          zIndex: 0
        };
      }
    }

    // 🌐 Default
    return {
      ...data,
      color: baseColor,
      size: 0.8,
      opacity: 0.3,
      zIndex: 0
    };
  });
}

function setupInteractions() {
  renderer.on("enterNode", ({ node }) => {
    hoveredNode = node;
    tooltip.style.display = "block";
    tooltip.innerText = graph.getNodeAttribute(node, "label");
    
    const pos = renderer.getNodeDisplayData(node);
    const halo = document.createElement("div");
    halo.className = "node-halo";
    halo.style.left = `${pos.x}px`;
    halo.style.top = `${pos.y}px`;
    halo.id = "node-halo";
    document.getElementById("sigma-container").appendChild(halo);        
    
    renderer.refresh();
  });

  renderer.on("leaveNode", () => {
    hoveredNode = null;
    tooltip.style.display = "none";
    const halo = document.getElementById("node-halo");
    if (halo) halo.remove();        
    renderer.refresh();
  });

  renderer.on("clickNode", ({ node }) => {
    selectedNode = node;
    showNodePanel(node);
    renderer.refresh();
  });

  renderer.on("clickStage", () => {
    hideNodePanel();
  });

  
  if (renderer) {
    renderer.getContainer().addEventListener("mousemove", e => {
      tooltip.style.left = e.pageX + 10 + "px";
      tooltip.style.top = e.pageY + 10 + "px";
    });
  }
}

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("clear-search");
  const panel = document.getElementById("side-panel");


  searchInput.addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const panel = document.getElementById("side-panel");

    clearBtn.style.display = query ? "block" : "none";

    if (!query) {
      selectedNode = null;
      panel.style.display = "none";
      renderer.refresh();
      return;
    }

    const match = graph.nodes().find(n =>
      graph.getNodeAttribute(n, "label").toLowerCase().includes(query)
    );

    selectedNode = match || null;

    if (match) {
      //showNodePanel(match);
      //panel.style.display = "flex";
    } else {
      panel.style.display = "none";
    }

    renderer.refresh();
  });
  
  document.getElementById("search-icon").addEventListener("click", () => {
    const searchDiv = document.getElementById("searchdiv");
    const input = document.getElementById("search-input");
    const searchVisible = searchDiv.style.display === "block" ? false : true;
    searchDiv.style.display = searchVisible ? "none" : "block";
    input.style.display = searchVisible ? "none" : "block";
    if (searchVisible) input.focus();
  });
  

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    selectedNode = null;
    clearBtn.style.display = "none";
    panel.style.display = "none";
    renderer.refresh();
  });
}

async function main(depth = 2, wipeGraph = true) {
  const panel = document.getElementById("side-panel");
  
  showLoader(); // ✅ show modal

  totalSteps = 1;
  currentStep = 0;
  //visitedKeys.clear();

  // Rebuild the graph object BEFORE rendering
  if (wipeGraph || !graph) {
    graph = new Graph({ multi: true });
    
  }
  visitedKeys.clear();
  await buildGraphRecursively(BASE_KEY, depth);

  applyNodeSizesByDegree();
  //fruchtermanReingold(graph);

  // Only now, create the renderer
  const container = document.getElementById("sigma-container");
  
  if (wipeGraph || !renderer) {
    container.innerHTML = ""; // ✅ clears canvas and attached DOM elements
    tooltip.style.display = "none";
    panel.style.display = "none";
    hoveredNode = null;
    selectedNode = null;      

  param = {labelColor: {color: isLightTheme() ? "#000" : "#9999ff"}}

    //renderer = new Sigma(graph, container);

    renderer = new Sigma(graph,container,param);
  }
 
 if (!wipeGraph)
  rebuildTransactionsByNeighbor();
 
  // Apply reducers and interactions
  setupReducers();
  setupInteractions();
  setupSearch();

  renderer.refresh();
  
  animateLayout();
  
  hideLoader(); // ✅ hide modal
  
  setTimeout(() => updateProgressBar(0, 1), 500); // clear bar after delay
  
  setupDateSlicer();  // 👈 à ajouter à la fin de main()
  
}




function exportJSON() {
  const json = {
    nodes: graph.nodes().map(n => ({ id: n, ...graph.getNodeAttributes(n) })),
    edges: graph.edges().map(e => ({
      id: e,
      source: graph.source(e),
      target: graph.target(e),
      ...graph.getEdgeAttributes(e)
    }))
  };

  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14); // YYYYMMDDHHMMSS
  const algorithm = document.getElementById("layout-algorithm")?.value || "unknown";
  const address = (BASE_KEY || "address").substring(0, 8);
  const filename = `${selectedBlockchain}-${algorithm}-${address}_${timestamp}.json`;

  a.href = url;
  a.download = filename;
  a.click();
}


function importJSON(file, mode="", iterations=500) {
  if (!graph || !renderer) {
    initRenderer();
  }

  hoveredNode = null;
  selectedNode = null;

  const reader = new FileReader();
  const progressBar = document.getElementById("progress-bar");

  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);

      if (!data.nodes || !data.edges) {
        alert("Invalid JSON format (missing 'nodes' or 'edges')");
        return;
      }

      graph.clear();
      const total = data.nodes.length + data.edges.length;
      let current = 0;
      updateProgressBar(current, total);

      data.nodes.forEach((n) => {
        graph.addNode(n.id, n);
        current++;
        updateProgressBar(current, total);
      });

      data.edges.forEach((e) => {
        if (e.timestamp) {
          e.timestamp = parseInt(e.timestamp); // 🛠️ Convert back to number
        }        
        graph.addEdgeWithKey(e.id, e.source, e.target, e);
        current++;
        updateProgressBar(current, total);
      });

      applyNodeSizesByDegree();     // reuse your logic
      //fruchtermanReingold(graph);   // optional
      renderer.refresh();

      // Reset bar
      setTimeout(() => {
        progressBar.value = 0;
        document.getElementById("progress-text").textContent = "";
      }, 300);

      if (mode === "")
        alert("Graph imported successfully!");
      rebuildTransactionsByNeighbor();
      setupDateSlicer();    
      setupReducers();
      setupInteractions();
      setupSearch();
      renderer.refresh();
      animateLayout(iterations);
    } catch (e) {
      console.error("Failed to load graph JSON:", e);
      alert("Failed to load graph JSON. See console for details.");
    }
  };

  reader.readAsText(file);
}


function exportPNG() {
  const nodeCanvas = document.querySelector("canvas.sigma-nodes");
  if (!nodeCanvas) {
    console.error("❌ Node canvas (.sigma-nodes) not found");
    return;
  }

  // Use the DISPLAY size (CSS) for output
  const cssWidth = nodeCanvas.offsetWidth;
  const cssHeight = nodeCanvas.offsetHeight;

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = cssWidth;
  exportCanvas.height = cssHeight;

  const ctx = exportCanvas.getContext("2d");

  // Optional black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  // Draw node canvas scaled from internal resolution to display size
  ctx.drawImage(
    nodeCanvas,
    0, 0, nodeCanvas.width, nodeCanvas.height, // source
    0, 0, cssWidth, cssHeight                  // destination (scaled)
  );

  // Export
  const link = document.createElement("a");
  link.download = "mina-nodes.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
}

async function demo() {
  const sampleFiles = [
    "sample1.json",
    "sample2.json",
    "sample3.json",
    "sample4.json",
  ];

  const randomFile = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];

  try {
    const response = await fetch(`./sample/${randomFile}`);
    if (!response.ok) throw new Error(`Erreur chargement ${randomFile}`);

    const blob = await response.blob();
    const file = new File([blob], randomFile, { type: "application/json" });

    // Injecter les valeurs spécifiques du layout dans l'UI
    document.getElementById("layout-algorithm").value = "fr";
    document.getElementById("layout-iterations").value = 5000;
    document.getElementById("layout-gravity").value = 0.01;
    document.getElementById("layout-scale").value = 5000;

    // Largeur/hauteur par défaut si non initialisées
    document.getElementById("layout-width").value = 2000;
    document.getElementById("layout-height").value = 2000;

    // Importer le graphe
    importJSON(file, "demo", 2000);

    // Lancer le layout avec petit délai (laisser le temps à importJSON de finir)
    const layoutBtn = document.getElementById("layout-toggle-btn");
    setTimeout(() => {
      //runLayoutInWorker();
      //layoutBtn.textContent = "Stop Layout";
      //isLayoutRunning = true;
      log_api_call("demo");
    }, 1200); // ajustable si import plus long
  } catch (error) {
    console.error("Erreur lors du chargement du fichier de démo :", error);
  }
}

// Save current layout parameters
function saveLayoutSettings(algorithm) {
  const settings = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY)) || {};

  const inputIds = {
    fr: ["layout-iterations", "layout-width", "layout-height", "layout-gravity", "layout-scale"],
    fa: ["layout-iterations", "layout-width", "layout-height", "layout-linlog", "layout-outbound"],
    ord: ["layout-iterations", "layout-width", "layout-height", "layout-ewi", "layout-cooling", "layout-attraction", "layout-repulsion", "layout-clusters"]
  };

  settings[algorithm] = {};

  inputIds[algorithm].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    settings[algorithm][id] = el.type === "checkbox" ? el.checked : parseFloat(el.value);
  });

  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(settings));
}

// Load layout parameters
function loadLayoutSettings(algorithm) {
  const settings = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY));
  if (!settings || !settings[algorithm]) return;

  Object.entries(settings[algorithm]).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") el.checked = val;
    else el.value = val;
  });
}

function getExplorerURL(type, value, blockchain) {
  const explorerMap = {
    mina: {
      block: `https://minascan.io/mainnet/block/${value}/txs`,
      transaction: `https://minascan.io/mainnet/tx/${value}/txInfo`,
      account: `https://minascan.io/mainnet/account/${value}`,
    },
    ethereum: {
      block: `https://etherscan.io/block/${value}`,
      transaction: `https://etherscan.io/tx/${value}`,
      account: `https://etherscan.io/address/${value}`,
    },
    polygon: {
      block: `https://polygonscan.com/block/${value}`,
      transaction: `https://polygonscan.com/tx/${value}`,
      account: `https://polygonscan.com/address/${value}`,
    },
    bsc: {
      block: `https://bscscan.com/block/${value}`,
      transaction: `https://bscscan.com/tx/${value}`,
      account: `https://bscscan.com/address/${value}`,
    },    
    solana: {
      block: `https://solscan.io/block/${value}`,
      transaction: `https://solscan.io/tx/${value}`,
      account: `https://solscan.io/account/${value}`,
    },
  };

  const chain = blockchain?.toLowerCase?.();
  return explorerMap[chain]?.[type] || "#";
}

function saveApiToken(chain, token) {
  const tokens = JSON.parse(localStorage.getItem("apiTokens") || "{}");
  tokens[chain] = token;
  localStorage.setItem("apiTokens", JSON.stringify(tokens));
}

function getApiToken(chain) {
  const tokens = JSON.parse(localStorage.getItem("apiTokens") || "{}");
  return tokens[chain] || "";
}

function clearApiToken(chain) {
  const tokens = JSON.parse(localStorage.getItem("apiTokens") || "{}");
  delete tokens[chain];
  localStorage.setItem("apiTokens", JSON.stringify(tokens));
}

function loadFetchParams() {
  const storedDepth = localStorage.getItem("param-depth");
  const storedLimit = localStorage.getItem("param-limit");
  const storedFirstLimit = localStorage.getItem("param-first-iteration");

  if (storedDepth !== null) document.getElementById("param-depth").value = storedDepth;
  if (storedLimit !== null) document.getElementById("param-limit").value = storedLimit;
  if (storedFirstLimit !== null) document.getElementById("param-first-iteration").value = storedFirstLimit;
}

function setupFetchParamListeners() {
  document.getElementById("param-depth").addEventListener("input", e => {
    localStorage.setItem("param-depth", e.target.value);
  });
  document.getElementById("param-limit").addEventListener("input", e => {
    localStorage.setItem("param-limit", e.target.value);
  });
  document.getElementById("param-first-iteration").addEventListener("input", e => {
    localStorage.setItem("param-first-iteration", e.target.value);
  });
}

function loadStartKeyForBlockchain(blockchain) {
  const savedKey = localStorage.getItem(`start-key-${blockchain}`);
  if (savedKey) {
    document.getElementById("param-base-key").value = savedKey;
    BASE_KEY = savedKey;
  }
}

function updateSlicerView() {
  const slicerContainer = document.getElementById("date-slicer-container");
  const slicerInner = document.getElementById("slicer-container");
  const chartCanvas = document.getElementById("slicer-chart");
  const labels = slicerContainer.querySelectorAll("#slicer-start-label, #slicer-end-label");
  const slider = document.getElementById("slicer-range");
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    document.body.classList.add("mobile-mode");

    if (chartCanvas) {
      chartCanvas.style.display = "none";
      chartCanvas.style.height = "0";
    }

    if (slicerInner) {
      slicerInner.style.height = "auto";
    }

    if (slicerContainer) {
      // 🧹 Clear any stale inline height or display
      slicerContainer.style.removeProperty("height");
      slicerContainer.style.removeProperty("display");

      // ✅ Force mobile layout re-apply
      slicerContainer.style.height = "auto";
      slicerContainer.style.display = "block";
    }
    labels.forEach(label => label.style.display = "none");
  } else {
    document.body.classList.remove("mobile-mode");

    if (chartCanvas) {
      chartCanvas.style.display = "block";
      chartCanvas.style.height = "150px";
    }

    if (slicerInner) {
      slicerInner.style.height = "140px";
    }

    labels.forEach(label => label.style.display = "inline-block");

    slicerContainer.style.display = "block";
    slicerContainer.style.height = "auto";
  }

  // Slider refresh or rebuild
  if (slider && slider.noUiSlider) {
    try {
      slider.noUiSlider.refresh?.(); // Optional chaining for non-standard APIs
    } catch (err) {
      console.warn("⚠️ noUiSlider.refresh failed, reinitializing...");

      try {
        if (!Array.isArray(allTimestamps) || allTimestamps.length < 2) {
          console.error("❌ allTimestamps are invalid, cannot rebuild slider.");
          slicerContainer.style.display = "none";
          return;
        }

        const values = slider.noUiSlider.get();
        const min = allTimestamps[0];
        const max = allTimestamps[allTimestamps.length - 1];

        slider.noUiSlider.destroy();
        slider.innerHTML = "";

        setTimeout(() => {
          noUiSlider.create(slider, {
            start: values.map(v => parseInt(v)),
            connect: true,
            range: { min, max },
            step: 24 * 60 * 60 * 1000,
            format: {
              to: value => Math.round(value),
              from: Number
            }
          });

          //console.log("✅ noUiSlider reinitialized");

          slider.noUiSlider.on("update", function (values) {
            currentRange = values.map(v => parseInt(v));
            applyDateFilter();
          });

          applyDateFilter();
        }, 50);
      } catch (e2) {
        console.error("🔥 Rebuild of noUiSlider failed:", e2);
      }
    }
  }
  
  // 🔒 Prevent re-showing slicer if fullscreen is active
  if (isFullscreen && slicerContainer) {
    slicerContainer.style.display = "none";
    return;
  }
}

async function connectAuroAndSend() {
  const email = document.getElementById("minataur-email").value.trim();
  if (!email || !email.includes("@")) {
    alert("Merci d'entrer un email valide");
    return;
  }

  if (!window.mina) {
    alert("Auro Wallet n'est pas détecté. Installez-le depuis https://www.aurowallet.com/");
    return;
  }

  try {
    const accounts = await window.mina.requestAccounts();
    const publicKey = accounts[0];
    console.log("Wallet connecté :", publicKey);

    // Construction transaction
    const { hash } = await window.mina.sendPayment({
      to: MINATAUR_API_ADDRESS,
      amount: "1.0",
      fee: "0.01",
      memo: email
    });

    alert("Transaction envoyée ! Hash : " + hash + "\nVotre token arrivera bientôt par email.");

    // Fold the section after success
    const tokenSection = document.getElementById("minataur-token-section");
    const arrow = document.getElementById("toggle-token-arrow");
    tokenSection.style.display = "none";
    if (arrow) arrow.textContent = "▸";
  } catch (err) {
    console.error("Erreur avec Auro :", err);
    alert("Erreur lors de l'envoi : " + err.message);
  }
}

function adjustSidebarState() {
  const sidebar = document.getElementById("left-sidebar");
  const appContainer = document.getElementById("app-container");
  const activeElement = document.activeElement;
  const isInputFocusedInSidebar = sidebar.contains(activeElement) &&
    (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.tagName === "SELECT");

  if (window.innerWidth >= 769 && !isFullscreen) {
    sidebar.classList.add("open");
    appContainer.classList.add("sidebar-open");
  } else {
    // ✅ Ne ferme pas la sidebar si un champ est actif dedans (sur mobile)
    if (!isInputFocusedInSidebar) {
      sidebar.classList.remove("open");
      appContainer.classList.remove("sidebar-open");
    }
  }

  // 👇 Always hide the slicer in fullscreen mode
  if (isFullscreen && slicer) {
    slicer.style.display = "none";
  }

  updateLegendOffset(); // 👈 met aussi à jour la légende
}

async function sendDonation() {
  const amount = parseFloat(document.getElementById("donation-amount").value);
  if (!amount || amount <= 0) {
    alert("Please enter a valid donation amount (at least 0.1 MINA).");
    return;
  }

  if (!window.mina) {
    alert("Auro Wallet not detected. Please install it from https://www.aurowallet.com/");
    return;
  }

  try {
    const accounts = await window.mina.requestAccounts();
    const sender = accounts[0];
    console.log("Donating from:", sender);

    const { hash } = await window.mina.sendPayment({
      to: DONATION_ADDRESS,
      amount: amount.toString(),
      fee: "0.01",
      memo: "Thanks for Mina Graph!"
    });

    alert("Thanks for your donation! Tx hash: " + hash);
  } catch (err) {
    console.error("Donation error:", err);
    alert("Error while sending donation: " + err.message);
  }
}

function toggleFullscreen(forceExit = false) {
  isFullscreen = forceExit ? false : !isFullscreen;
  const legend = document.getElementById("legend");
  const menu = document.getElementById("menu-toggle");

  if (isFullscreen) {
    sidebar.style.display = "none";
    controls.style.display = "none";
    slicer.style.display = "none";
    if (footer) footer.style.display = "none";
    appContainer.classList.remove("sidebar-open"); // 👈 remove margin
    //sidebar.classList.remove("open"); // 👈 remove margin
    fullscreenBtn.textContent = "Exit Fullscreen";
    exitFullscreenBtn.style.display = "block";
    document.body.classList.add("fullscreen-mode");
    legend.style.left = "50px";
    legend.style.display="none";
    menu.style.display="none"
  } else {
    sidebar.style.display = "block";
    controls.style.display = "flex";
    slicer.style.display = "block";
    legend.style.display="block";
    legend.style.top = "20px";
    if (footer) footer.style.display = "block";
    menu.style.display="block"

    // 👇 Only add sidebar-open on desktop
    if (window.innerWidth >= 769 && sidebar.classList.contains("open")) {
      appContainer.classList.add("sidebar-open");
      legend.style.left = "330px"; // sidebar + margin
    } else { 
      appContainer.classList.remove("sidebar-open");
      legend.style.left = "50px";
    }

    fullscreenBtn.textContent = "⛶";
    exitFullscreenBtn.style.display = "none";
    document.body.classList.remove("fullscreen-mode");
    updateLegendOffset(); // 👈 and here too
  }
}

function setupDateSlicer() {
  if (!graph || !graph.edges) return;

  const timestamps = graph.edges().map(id => {
    const ts = graph.getEdgeAttribute(id, "timestamp");
    return typeof ts === "string" ? parseInt(ts) : ts;
  }).filter(t => !isNaN(t)).sort((a, b) => a - b);

  if (!timestamps.length) return;

  allTimestamps = timestamps;

  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  const binCount = 20;
  const binSize = Math.ceil((maxTimestamp - minTimestamp) / binCount);
  currentRange = [minTimestamp, maxTimestamp];

  const bins = new Array(binCount).fill(0);
  timestamps.forEach(ts => {
    const index = Math.min(Math.floor((ts - minTimestamp) / binSize), binCount - 1);
    bins[index]++;
  });

  const ctx = document.getElementById("slicer-chart").getContext("2d");
  if (histogramChart) histogramChart.destroy();

  histogramChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins.map((_, i) => {
        const d = new Date(minTimestamp + i * binSize);
        return d.toLocaleDateString(); // or d.toISOString().slice(0, 10)
      }),
      datasets: [{
        label: 'Tx Count',
        data: bins,
        backgroundColor: '#4fc3f7'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => {
              const index = tooltipItems[0].dataIndex;
              const startDate = new Date(minTimestamp + index * binSize);
              const endDate = new Date(minTimestamp + (index + 1) * binSize);
              return `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Transaction Date'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Count'
          }
        }
      }
    }
  });

  // Create noUiSlider range control
  const slider = document.getElementById("slicer-range");
  slider.innerHTML = ""; // Clear any previous

  // 💥 Prevent re-initialization
  if (slider.noUiSlider) {
    slider.noUiSlider.destroy();
  }

  noUiSlider.create(slider, {
    start: [minTimestamp, maxTimestamp],
    connect: true,
    range: {
      min: minTimestamp,
      max: maxTimestamp
    },
    step: 24 * 60 * 60 * 1000, // 1 day in ms
    tooltips: [false, false], // start with no tooltip
    format: {
      to: value => Math.round(value),
      from: Number
    }
  });

  const handles = slider.querySelectorAll('.noUi-handle');

  // On drag start: add tooltip divs
  slider.noUiSlider.on("start", () => {
    handles.forEach((handle, i) => {
      if (!handle.querySelector('.tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.top = '-28px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.background = '#000';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '2px 6px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '11px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.opacity = '0.9';
        handle.appendChild(tooltip);
      }
    });
  });

  // On slide: update tooltip content
  slider.noUiSlider.on("slide", (values) => {
    handles.forEach((handle, i) => {
      const tooltip = handle.querySelector('.tooltip');
      if (tooltip) {
        tooltip.textContent = new Date(+values[i]).toLocaleDateString();
      }
    });
  });

  // On end: remove tooltips
  slider.noUiSlider.on("end", () => {
    handles.forEach(handle => {
      const tooltip = handle.querySelector('.tooltip');
      if (tooltip) tooltip.remove();
    });
  });

  // Update range filter
  slider.noUiSlider.on("update", function (values) {
    currentRange = values.map(v => parseInt(v));
    applyDateFilter(); // filter the graph dynamically
  });


  applyDateFilter(); // Initial filtering
}


function applyDateFilter() {
  const [min, max] = currentRange;

  const formatter = ts => new Date(ts).toLocaleDateString();
  document.getElementById("slicer-start-label").textContent = `From: ${formatter(min)}`;
  document.getElementById("slicer-end-label").textContent = `To: ${formatter(max)}`;

  graph.forEachEdge((e, attrs) => {
    const ts = parseInt(attrs.timestamp);
    const keep = ts >= min && ts <= max;
    graph.setEdgeAttribute(e, "hidden", !keep);
  });

  const visibleNodes = new Set();
  graph.forEachEdge((e) => {
    if (!graph.getEdgeAttribute(e, "hidden")) {
      visibleNodes.add(graph.source(e));
      visibleNodes.add(graph.target(e));
    }
  });

  graph.forEachNode((n) => {
    graph.setNodeAttribute(n, "hidden", !visibleNodes.has(n));
  });

  renderer.refresh();
}

function hideNodePanel() {
  const panel = document.getElementById("side-panel");
  const slicer = document.getElementById("date-slicer-container");
  
  document.getElementById("side-panel").classList.remove("open");

  panel.style.display = "none";
  slicer.classList.remove("on-left");

  selectedNode = null;
  renderer.refresh();
}

function rebuildTransactionsByNeighbor() {
  transactionsByNeighbor = {}; // ⚠️ Assure-toi que cette variable est bien déclarée globalement avec let

  graph.forEachEdge((edge, attrs, source, target) => {
    const tx = {
      blockchain: attrs.blockchain,
      sender_key: source,
      receiver_key: target,
      command_type: attrs.label,
      status: attrs.status,
      timestamp: attrs.timestamp,
      hash: edge,
      fee: attrs.fee,
      amount: attrs.amount,
      block_id: attrs.block_id,
      block_hash: attrs.block_hash,
      memo: attrs.memo,
      label: attrs.label,
      token_contract: attrs.token_contract,
      token_receiver: attrs.token_receiver,
      token_amount: attrs.token_amount,
      token_name: attrs.token_name,
      token_decimals: attrs.token_decimals      
    };

    if (!transactionsByNeighbor[source]) transactionsByNeighbor[source] = [];
    if (!transactionsByNeighbor[target]) transactionsByNeighbor[target] = [];

    transactionsByNeighbor[source].push(tx);
    transactionsByNeighbor[target].push(tx);
  });
}
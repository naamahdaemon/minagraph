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
let visitedKeysByChain = new Map();
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
const chainFilter = new Set();

let showAllLabels = true;
let selectedBlockchain = "mina"; // 👈 default value

const delayByBlockchain = {
  mina: 0,
  ethereum: 300,
  zksync: 300,
  optimism: 300,
  arbitrum: 300,
  polygon: 300,
  bsc: 300,
  solana: 300,
  cronos: 500,
  tezos: 300,
  base: 300,
};

let cancelRequested = false;
let isLayoutRunning = false;
let layoutWorker;
let currentLayout = null;  // the one currently running
let previousLayout = null;
const LAYOUT_STORAGE_KEY = "layoutSettings";
const commandTypeAliases = {
  payment: ["payment", "transfer"],
  zkapp: ["zkapp", "contract_call","contract_creation"],
  delegation: ["delegation","stake","delegate"],
  token_transfer: ["token_transfer", "nft_transfer"],
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
let extraTokens = {}; // New loaded tokens

const knownTokens = {
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { name: "Tether USD", symbol: "USDT", decimals: 6 },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { name: "USD Coin", symbol: "USDC", decimals: 6 },
  "0x6b175474e89094c44da98b954eedeac495271d0f": { name: "Dai Stablecoin", symbol: "DAI", decimals: 18 },
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { name: "Wrapped Ether", symbol: "WETH", decimals: 18 },
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": { name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8 },
  "0x514910771af9ca656af840dff83e8264ecf986ca": { name: "ChainLink", symbol: "LINK", decimals: 18 },
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": { name: "Aave", symbol: "AAVE", decimals: 18 },
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": { name: "Uniswap", symbol: "UNI", decimals: 18 },
  "0xaf4dce16da2877f8c9e00544c93b62ac40631f16": { name: "Monetha", symbol: "MTH", decimals: 5 },
  "0x54318a379935d545eb8e474a191e11faac5a46e8": { name: "KKCOIN ", symbol: "KK", decimals: 8 },
  "0x58d0a58e4b165a27e4e1b8c2a3ef39c89b581180": { name: "ShowCoin  ", symbol: "Show", decimals: 18 },
  // Add more as needed
};
document.addEventListener("DOMContentLoaded", () => {
  panel = document.getElementById("side-panel");
  tooltip = document.getElementById("tooltip");
  details = document.getElementById("node-details");
  apiTokenInput = document.getElementById("param-api-token");
  blockchainSelect = document.getElementById("blockchain-select");    
  tokenInput = document.getElementById("param-api-token");
  //chain = blockchainSelect.value;
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

  const params = new URLSearchParams(window.location.search);
  const param_chain = params.get("chain");
  const param_address = params.get("address");
  const param_firstLimit = params.get("firstiterationlimit");
  const param_depth = params.get("depth");
  const param_limit = params.get("iterationlimit");
  
  // Load selected blockchain from localStorage
  const storedBlockchain = localStorage.getItem('selectedBlockchain');
  if (storedBlockchain) {
    blockchainSelect.value = storedBlockchain;
    apiTokenInput.value = getApiToken(storedBlockchain) || ''; // Si le token est manquant, réinitialiser à une valeur vide
    loadStartKeyForBlockchain(storedBlockchain); // Charger la clé de départ pour la blockchain sélectionnée
  } else {
    // Si aucune blockchain n'est stockée, définir la valeur par défaut
    blockchainSelect.value = "mina"; // Par exemple, Mina comme valeur par défaut
    apiTokenInput.value = getApiToken("mina") || ''; // Récupérer le token pour Mina
    loadStartKeyForBlockchain("mina"); // Charger la clé de départ pour Mina
  }

  blockchainSelect.addEventListener("change", () => {
    const chain = blockchainSelect.value;
    // Save selected blockchain to localStorage
    localStorage.setItem('selectedBlockchain', chain);
    apiTokenInput.value = getApiToken(chain);
    loadStartKeyForBlockchain(chain);
  });
  
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
  
  if (param_chain && param_address) {
    document.getElementById("blockchain-select").value = param_chain;
    document.getElementById("param-base-key").value = param_address;

    if (param_firstLimit) {
      document.getElementById("param-first-iteration").value = param_firstLimit;
    }
    if (param_depth) {
      document.getElementById("param-depth").value = param_depth;
    }
    if (param_limit) {
      document.getElementById("param-limit").value = param_limit;
    }

    // Optionally trigger graph fetch automatically
    setTimeout(() => {
      // Safer version: call main() directly
      BASE_KEY = param_address;
      main(parseInt(param_depth || "2"), true, param_chain);
      history.replaceState(null, '', window.location.pathname);
    }, 600);
  } else {  
  loadFetchParams();
  }
  setupFetchParamListeners();

  apiTokenInput.value = getApiToken(chain);
  loadStartKeyForBlockchain(chain);  

  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.getAttribute('data-command-type');

      if (!type) {
        // Reset both filters
        commandTypeFilter.clear();
        chainFilter.clear();
        console.log("🔄 All filters reset");

        // Visually reset all items
        document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.legend-chain').forEach(el => el.classList.remove('active'));

        // Refresh only if renderer exists
        if (typeof renderer !== "undefined" && renderer?.refresh) {
          renderer.refresh();
        }
        return; // Exit early, no further processing needed for reset
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
      // Refresh only if renderer exists
      if (typeof renderer !== "undefined" && renderer?.refresh) {
        renderer.refresh();
      }
    });
  });
  
  document.querySelectorAll('.legend-chain').forEach(item => {
    item.addEventListener('click', () => {
      const chain = item.getAttribute('data-chain');

      if (!chain) return;

      const isActive = chainFilter.has(chain);
      if (isActive) {
        chainFilter.delete(chain);
        console.log(`❌ Removed chain filter: ${chain}`);
      } else {
        chainFilter.add(chain);
        console.log(`✅ Added chain filter: ${chain}`);
      }

      // Update visual state
      document.querySelectorAll('.legend-chain').forEach(el => {
        const ch = el.getAttribute('data-chain');
        el.classList.toggle('active', chainFilter.has(ch));
      });

      console.log(`🌐 Final chain filter set: ${Array.from(chainFilter)}`);
      // Refresh only if renderer exists
      if (typeof renderer !== "undefined" && renderer?.refresh) {
        renderer.refresh();
      }
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
  
  document.querySelectorAll('.legend-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetSelector = toggle.getAttribute('data-target');
      const target = document.querySelector(targetSelector);
      if (!target) return;

      const isVisible = target.style.display !== 'none';
      target.style.display = isVisible ? 'none' : 'block';

      // Update toggle icon (▶ or ▼)
      toggle.innerHTML = `<em>${isVisible ? '▶' : '▼'} ${toggle.textContent.slice(2)}</em>`;
    });
  });
  
  const status = document.getElementById('network-status');

  function updateNetworkStatus() {
    if (navigator.onLine) {
      status.style.display = 'none';
      console.log('[PWA] Online');
    } else {
      status.style.display = 'block';
      console.warn('[PWA] Offline mode – using cached data');
    }
  }

  updateNetworkStatus(); // initial

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);  
  
  if ('launchQueue' in window && 'files' in LaunchParams.prototype) {
    window.launchQueue.setConsumer(launchParams => {
      const fileHandle = launchParams.files[0];
      if (fileHandle) {
        fileHandle.getFile().then(file => {
          importJSON(file);
        });
      }
    });
  }
  
  document.getElementById("search-input").addEventListener("input", e => {
    handleSearch(e.target.value);
  });
  
  // --- Listen to service worker push message
  navigator.serviceWorker?.addEventListener('message', event => {
    if (event.data?.type === 'notification-action') {
      const { payload, action } = event.data;

      // Exécuter selon l'action
      if (action === 'show_graph' && payload.chain && payload.address) {
        console.log('[UI] Triggering graph from notification action');
        handleNotificationActions(payload); // ou ta logique directe
      }
    }

    if (event.data?.type === 'push-received') {
      const notif = event.data.payload;
      if (!notif?.message_id) {
        console.warn('[UI] Ignored message with no ID');
        return;
      }

      saveNotificationToStorage(notif)
        .then(updateNotificationBadge)
        .catch(err => console.error('Failed to store notification:', err));

      //handleNotificationActions(notif); // Optionnel ici si déjà couvert plus haut
    }
  });

  const resetBtn = document.getElementById('reset-db-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const confirmed = confirm("Are you sure you want to delete all saved notifications?");
      if (confirmed) {
        indexedDB.deleteDatabase('notificationDB');
        alert("Notifications database deleted. Reload the page to reinitialize.");
        location.reload();
      }
    });
  }

  if (location.hostname !== 'localhost') {
    document.getElementById('reset-db-btn')?.remove();
  }

  
  document.getElementById('notification-button')?.addEventListener('click', () => {
    const panel = document.getElementById('notification-list');
    if (panel.style.display === 'block') {
      panel.style.display = 'none';
    } else {
      showNotificationList();
    }
  });
  
  document.addEventListener('click', function (event) {
    const list = document.getElementById('notification-list');
    const button = document.getElementById('notification-button');
    if (!list.contains(event.target) && !button.contains(event.target)) {
      list.style.display = 'none';
    }
  });
  
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log("✅ Push permission granted");
      } else {
        console.warn("⚠️ Push permission denied:", permission);
      }
    });
  }
  
  updateNotificationBadge();
});

init();

function handleNotificationActions(notif) {
  if (!notif || !notif.action_primary) return;

  if (notif.action_primary === 'show_graph' && notif.chain && notif.address) {
    console.log('[UI] Triggering graph display from push:', notif.chain, notif.address);
    try {
      BASE_KEY = notif.address;
      main(2, true, notif.chain); 
    } catch (e) {
      console.error('Error triggering graph from notification:', e);
    }
  }
}



async function init() {
  await loadExtraTokensFromCSV('./tokens/tokens.csv');
  // Ensuite tu peux continuer ton code ici
}

async function loadExtraTokensFromCSV(filePath) {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    const lines = csvText.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#")) continue; // skip empty or comment lines
      const [address, name, symbol, decimals] = line.split(',').map(v => v.trim());
      if (address && name && symbol && !isNaN(decimals)) {
        extraTokens[address.toLowerCase()] = {
          name,
          symbol,
          decimals: parseInt(decimals, 10)
        };
      }
    }
    console.log(`Loaded ${Object.keys(extraTokens).length} extra tokens.`);
  } catch (err) {
    console.error("Failed to load token CSV:", err);
  }
}

function getKnownTokenInfo(contractAddress) {
  if (!contractAddress) return null;
  const addr = contractAddress.toLowerCase();
  return knownTokens[addr] || extraTokens[addr] || null;
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

function showOverlaySpinner(chain, nb=100) {
  document.getElementById("overlay-message").textContent = `Fetching ${nb} more from ${capitalize(chain)}...`;
  const spinner = document.getElementById("overlay-spinner");
  spinner.classList.remove("overlay-hidden");
  spinner.classList.add("overlay-visible");
}

function hideOverlaySpinner() {
  const spinner = document.getElementById("overlay-spinner");
  spinner.classList.remove("overlay-visible");
  spinner.classList.add("overlay-hidden");
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
    case "zksync":
    case "optimism":
    case "arbitrum":
    case "cronos":
    case "base":
      return 18;
    case "solana":      
    case "mina":
      return 9;
    case "tezos": 
      return 6;
    default:
      return 18; // Default fallback
  }
}

function saveToFile(filename, content) {
  const blob = new Blob([content], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
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

function getColorByDegree(degree, minDeg, maxDeg, chain, chainCount = 1) {
  // 🎯 Special color for nodes shared across multiple chains
  if (chainCount > 1) return "#ff00ff"; // orange

  const chainBaseHSL = {
    ethereum: [230, 70, 60],
    polygon: [270, 60, 60],
    bsc: [45, 100, 50],
    solana: [280, 100, 70],
    zksync: [330, 100, 70],
    optimism: [20, 100, 60],
    arbitrum: [190, 70, 60],
    cronos: [0, 85, 50],
    tezos: [215, 100, 55],
    starknet: [260, 100, 55],
    mina: [180, 50, 45],
    base: [200, 100, 60]
  };

  const [baseHue, baseSat, baseLight] = chainBaseHSL[chain] || [300, 100, 50];

  if (maxDeg === minDeg) return hslToHex(baseHue, baseSat, baseLight);

  const ratio = (degree - minDeg) / (maxDeg - minDeg);
  const hue = baseHue;
  const saturation = baseSat - ratio * 20;
  const lightness = baseLight + ratio * 20;

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
      settings.strongGravityMode = document.getElementById("layout-strong-gravity")?.checked || false;
      settings.preventOverlap = document.getElementById("layout-prevent-overlap")?.checked ?? true;
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

function getTezosCommandType(op) {
  if (op.type === 'delegation') return { command_type: 'delegate', contract_call_entrypoint: null };
  if (op.type === 'reveal') return { command_type: 'reveal', contract_call_entrypoint: null };
  if (op.type === 'origination') return { command_type: 'contract_creation', contract_call_entrypoint: null };
  if (op.type === 'transaction') {
    if (!op.target) return { command_type: 'contract_call', contract_call_entrypoint: null };

    const entrypoint = op.parameter?.entrypoint;

    if (entrypoint) {
      // Handling contract calls (everything starting with "contract_call:")
      if (entrypoint.startsWith("contract_call:")) {
        return { command_type: 'contract_call', contract_call_entrypoint: entrypoint };
      }

      // For other known specific cases
      switch (entrypoint) {
        case 'transfer': return { command_type: 'token_transfer', contract_call_entrypoint: null };
        case 'mint': return { command_type: 'token_mint', contract_call_entrypoint: null };
        case 'burn': return { command_type: 'token_burn', contract_call_entrypoint: null };
        case 'update_operators': return { command_type: 'update_operators', contract_call_entrypoint: null };
        case 'set_delegate': return { command_type: 'set_delegate', contract_call_entrypoint: null };
        case 'withdraw': return { command_type: 'withdraw', contract_call_entrypoint: null };
        case 'deposit': return { command_type: 'deposit', contract_call_entrypoint: null };
        case 'default': return { command_type: 'contract_call', contract_call_entrypoint: null }; // Default case for contract calls
        default: return { command_type: 'contract_call', contract_call_entrypoint: entrypoint }; // fallback for unknown entrypoints
      }
    }

    // Simple native tez transfer
    return { command_type: 'transfer', contract_call_entrypoint: null };
  }

  return { command_type: 'unknown', contract_call_entrypoint: null };
}


// Analyse les changements de balances pour trouver sender et receiver token
function getTokenTransferInfo(tx) {
  const result = {
    sender_key: null,
    receiver_key: null,
    token_receiver: null,
    token_contract: null,
    token_amount: null,
    token_decimals: null,
    token_name: null,
  };

  if (!tx.meta?.postTokenBalances || !tx.meta?.preTokenBalances) return result;

  const preByIndex = Object.fromEntries(tx.meta.preTokenBalances.map(p => [p.accountIndex, p]));
  const postByIndex = Object.fromEntries(tx.meta.postTokenBalances.map(p => [p.accountIndex, p]));

  for (const index in postByIndex) {
    const post = postByIndex[index];
    const pre = preByIndex[index];
    const change =
      (parseFloat(post.uiTokenAmount?.uiAmount || "0") -
        parseFloat(pre?.uiTokenAmount?.uiAmount || "0"));

    const account = tx.transaction.message.accountKeys[post.accountIndex];
    const owner = post.owner;
    const mint = post.mint;

    result.token_contract = mint;
    result.token_decimals = post.uiTokenAmount?.decimals || null;

    // optionnel : nom du token
    const cached = getKnownTokenInfo?.(mint);
    if (cached?.symbol) {
      result.token_name = cached.symbol;
    }

    if (change > 0) {
      result.receiver_key = owner;
      result.token_receiver = account.pubkey;
      result.token_amount = change.toString();  // ✅ ici le delta réel
    } else if (change < 0) {
      result.sender_key = owner;
    }
  }

  return result;
}

async function fetchSolanaTransactions(publicKey, limit, baseUrl) {
  const headers = {
    'x-api-key': '2c57fa11-3463-47fa-802d-116c2dfff660',
    "Content-Type": "application/json"
  };
  
  const transactions = [];

  const signaturesPayload = {
    jsonrpc: "2.0",
    id: 1,
    method: "getSignaturesForAddress",
    params: [publicKey, { limit }]
  };

  const signaturesRes = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(signaturesPayload)
  });

  const signaturesJson = await signaturesRes.json();
  if (!signaturesJson?.result) throw new Error("Invalid Solana signature response");

  for (const sig of signaturesJson.result) {
    const txPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [sig.signature, {
        encoding: "jsonParsed",
        commitment: "finalized",
        maxSupportedTransactionVersion: 0
      }]
    };

    let tx = null;
    try {
    const txRes = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(txPayload) });
    const txJson = await txRes.json();
      tx = txJson?.result;
      if (!tx) throw new Error("No tx result");
    } catch (err) {
      console.warn(`⚠️ Failed to fetch Solana tx ${sig.signature}: ${err.message}`);
      continue; // skip this tx and continue with others
    }


    const accountKeys = tx.transaction.message.accountKeys || [];
    const fallbackSender = accountKeys?.[0]?.pubkey || null;
    const blockTime = tx.blockTime ? `${tx.blockTime * 1000}` : null;
    const command_type = getSolCommandType(tx);

    console.log("Detected command type:", command_type, "for tx:", tx.transaction.signatures[0], " sender:", fallbackSender);



    let hasTokenTransfer = false;
    let hasSolTransfer = false;
    let hasStakeTransaction = false;

    // === 1. SPL TOKEN TRANSFERS ===
    const preToken = tx.meta?.preTokenBalances || [];
    const postToken = tx.meta?.postTokenBalances || [];

    for (const post of postToken) {
      const pre = preToken.find(p => p.accountIndex === post.accountIndex);
      const preAmount = parseFloat(pre?.uiTokenAmount?.uiAmount || "0");
      const postAmount = parseFloat(post.uiTokenAmount?.uiAmount || "0");
      const delta = postAmount - preAmount;

      if (delta === 0) continue;

      const account = accountKeys[post.accountIndex];
      const tokenMint = post.mint;
      const tokenDecimals = post.uiTokenAmount?.decimals || null;
      const tokenName = getKnownTokenInfo?.(tokenMint)?.symbol || null;

      transactions.push({
        blockchain: 'solana',
        block_id: tx.slot,
        height: tx.slot,
        timestamp: blockTime,
        hash: tx.transaction.signatures[0],
        command_type: "token_transfer",
        label: "token_transfer",
        amount: "0",
        fee: tx.meta?.fee?.toString() || "0",
        memo: "",
        status: tx.meta?.err ? "failed" : "applied",
        failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
        sender_key: delta < 0 ? post.owner : fallbackSender,
        receiver_key: delta > 0 ? post.owner : null,
        sender_name: "noname",
        receiver_name: "noname",
        fee_payer_key: fallbackSender,
        chain_status: "canonical",
        block_hash: tx.slot,
        token_contract: tokenMint,
        token_receiver: delta > 0 ? account.pubkey : null,
        token_amount: Math.abs(delta).toString(),
        token_name: tokenName,
        token_decimals: tokenDecimals,
        r_thief: 0, s_thief: 0, r_scammer: 0, s_scammer: 0, r_spammer: 0, s_spammer: 0
      });

      hasTokenTransfer = true;
    }

    // === 2. NATIVE SOL TRANSFERS ===
    const preSol = tx.meta?.preBalances || [];
    const postSol = tx.meta?.postBalances || [];
    const deltaSol = preSol.map((pre, i) => (postSol[i] || 0) - pre);
    const solTransfers = [];

    for (let i = 0; i < deltaSol.length; i++) {
      const delta = deltaSol[i];
      if (delta !== 0) {
        solTransfers.push({
          key: accountKeys[i]?.pubkey || `unknown_${i}`,
          delta,
          index: i
        });
      }
    }

    const senders = solTransfers.filter(d => d.delta < 0).sort((a, b) => a.delta - b.delta);
    const receivers = solTransfers.filter(d => d.delta > 0).sort((a, b) => b.delta - a.delta);

    while (senders.length && receivers.length) {
      const sender = senders.shift();
      const receiver = receivers.shift();
      const amount = Math.min(Math.abs(sender.delta), receiver.delta);

      if (amount < 1) continue;
      if (command_type === "token_transfer") continue;

      transactions.push({
        blockchain: 'solana',
        block_id: tx.slot,
        height: tx.slot,
        timestamp: blockTime,
        hash: tx.transaction.signatures[0],
        command_type,
        label: command_type === "transfer" ? "payment" : command_type,
        amount: amount.toString(),
        fee: tx.meta?.fee?.toString() || "0",
        memo: "",
        status: tx.meta?.err ? "failed" : "applied",
        failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
        sender_key: sender.key,
        receiver_key: receiver.key,
        sender_name: "noname",
        receiver_name: "noname",
        fee_payer_key: fallbackSender,
        chain_status: "canonical",
        block_hash: tx.slot,
        token_contract: null,
        token_receiver: null,
        token_amount: null,
        token_name: null,
        token_decimals: null,
        r_thief: 0, s_thief: 0, r_scammer: 0, s_scammer: 0, r_spammer: 0, s_spammer: 0
      });

      hasSolTransfer = true;

      const remainingSender = Math.abs(sender.delta) - amount;
      const remainingReceiver = receiver.delta - amount;

      if (remainingSender > 0) {
        senders.unshift({ ...sender, delta: -remainingSender });
      }

      if (remainingReceiver > 0) {
        receivers.unshift({ ...receiver, delta: remainingReceiver });
      }
    }

  // === 3. STAKE TRANSACTIONS ===
  if (command_type === "stake") {
    const stakeInstr = tx.transaction.message.instructions.find(
      inst => inst.program === "stake" && inst.parsed?.info?.voteAccount
    );
    const voteAccount = stakeInstr?.parsed?.info?.voteAccount || null;

    transactions.push({
      blockchain: 'solana',
      block_id: tx.slot,
      height: tx.slot,
      timestamp: blockTime,
      hash: tx.transaction.signatures[0],
      command_type: "stake",
      label: "stake",
      nonce: null,
      amount: "0",
      fee: tx.meta?.fee?.toString() || "0",
      memo: "",
      sequence_no: null,
      status: tx.meta?.err ? "failed" : "applied",
      failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
      confirm: null,
      sender_id: null,
      receiver_id: null,
      sender_key: fallbackSender,
      receiver_key: voteAccount,
      sender_name: "noname",
      receiver_name: "validator",
      fee_payer_id: null,
      fee_payer_key: fallbackSender,
      fee_payer_name: null,
      chain_status: "canonical",
      block_hash: tx.slot,
      r_thief: 0, s_thief: 0,
      r_scammer: 0, s_scammer: 0,
      r_spammer: 0, s_spammer: 0,
      token_contract: null,
      token_receiver: null,
      token_amount: null,
      token_name: null,
      token_decimals: null
    });
    
    hasStakeTransaction = true;
    
  }

    // === 3. CONTRACT / STAKE / MISC INTERACTIONS ===
    if (!hasTokenTransfer && !hasSolTransfer && !hasStakeTransaction) {
      transactions.push({
        blockchain: 'solana',
        block_id: tx.slot,
        height: tx.slot,
        timestamp: blockTime,
        hash: tx.transaction.signatures[0],
        command_type,
        label: command_type,
        amount: "0",
        fee: tx.meta?.fee?.toString() || "0",
        memo: "",
        status: tx.meta?.err ? "failed" : "applied",
        failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
        sender_key: fallbackSender,
        receiver_key: null,
        sender_name: "noname",
        receiver_name: "noname",
        fee_payer_key: fallbackSender,
        chain_status: "canonical",
        block_hash: tx.slot,
        token_contract: null,
        token_receiver: null,
        token_amount: null,
        token_name: null,
        token_decimals: null,
        r_thief: 0, s_thief: 0, r_scammer: 0, s_scammer: 0, r_spammer: 0, s_spammer: 0
      });
    }
  }



  return transactions;
}

async function fetchCronosTransactions(normalizedKey, limit = 10000, baseUrl) {
  const headers = {
    'x-api-key': '75e3206b-5dc8-493c-ad1e-72fe521b3a01'
  };

  // === 1. Extraire l'URL cible actuelle de l’URL proxy
  const currentEncodedTarget = new URL(baseUrl).searchParams.get("url");
  if (!currentEncodedTarget) throw new Error("Missing 'url' param in proxy URL");

  const baseTargetUrl = decodeURIComponent(currentEncodedTarget);

  // === 2. Construire l'URL complète avec tous les paramètres
  const queryParams = new URLSearchParams({
    module: "account",
    action: "txlist",
    address: normalizedKey, // <- injecté depuis appel
    startblock: "0",
    endblock: "99999999",
    sort: "asc",
    page: "1",
    offset: limit.toString()
  });

  const fullTargetUrl = `${baseTargetUrl}?${queryParams.toString()}`;
  const encodedTargetUrl = encodeURIComponent(fullTargetUrl);

  // === 3. Reconstruire l'URL finale complète vers le proxy
  const finalUrl = `https://www.akirion.com:4664/proxy?url=${encodedTargetUrl}`;

  const res = await fetch(finalUrl, { headers });

  if (!res.ok) {
    throw new Error(`Cronos proxy error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (!json || !json.result) throw new Error("Unexpected response format from Cronos");

  if (json.status === "0" && json.message === "No transactions found") {
    return [];
  }

  const transactions = [];

  for (const tx of json.result) {
    const isContractCreation = !tx.to;
    const isTokenTransfer = tx.input && tx.input.startsWith("0xa9059cbb");

    let tokenReceiver = null;
    let tokenAmount = null;
    let tokenName = null;
    let tokenDecimals = null;

    if (isTokenTransfer && tx.input.length >= 138) {
      try {
        tokenReceiver = "0x" + tx.input.slice(34, 74);
        tokenAmount = BigInt("0x" + tx.input.slice(74, 138)).toString();
        const tokenInfo = getKnownTokenInfo?.(tx.to);
        if (tokenInfo) {
          tokenName = tokenInfo.symbol;
          tokenDecimals = tokenInfo.decimals;
        }
      } catch (err) {
        console.warn(`Failed to parse ERC20 input for tx ${tx.hash}`);
      }
    }

    const baseTx = {
      blockchain: 'cronos',
      block_id: parseInt(tx.blockNumber),
      height: parseInt(tx.blockNumber),
      timestamp: `${parseInt(tx.timeStamp) * 1000}`,
      hash: tx.hash,
      amount: tx.value,
      fee: (BigInt(tx.gasUsed || "0") * BigInt(tx.gasPrice || "0")).toString(),
      memo: "",
      status: tx.isError === "0" ? "applied" : "failed",
      failure_reason: tx.isError === "0" ? null : "execution_error",
      sender_key: tx.from.toLowerCase(),
      receiver_key: tx.to ? tx.to.toLowerCase() : null,
      sender_name: "noname",
      receiver_name: isContractCreation ? "contract_creation" : "noname",
      fee_payer_key: tx.from.toLowerCase(),
      chain_status: "canonical",
      block_hash: tx.blockHash,
      token_contract: isTokenTransfer ? tx.to?.toLowerCase() : null,
      token_receiver: tokenReceiver?.toLowerCase() || null,
      token_amount: tokenAmount,
      token_name: tokenName,
      token_decimals: tokenDecimals,
      r_thief: 0, s_thief: 0, r_scammer: 0, s_scammer: 0, r_spammer: 0, s_spammer: 0
    };

    // Token transfer = 2 lignes : appel contrat + transfert
    if (isTokenTransfer) {
      transactions.push({
        ...baseTx,
        command_type: "contract_call",
        label: "contract_call"
      });

      transactions.push({
        ...baseTx,
        command_type: "token_transfer",
        label: "token_transfer",
        amount: "0", // pas de CRO transféré
        receiver_key: tokenReceiver?.toLowerCase() || null,
        receiver_name: tokenReceiver
          ? tokenReceiver.toLowerCase().slice(0, 6) + "..." + tokenReceiver.toLowerCase().slice(-6)
          : "unknown"
      });
    } else {
      // Paiement CRO ou appel contractuel sans transfert explicite
      transactions.push({
        ...baseTx,
        command_type: tx.input && tx.input !== "0x" ? "contract_call" : "transfer",
        label: tx.input && tx.input !== "0x" ? "contract_call" : "payment"
      });
    }
  }

  return transactions;
}

async function fetchTezosTransactions(tezosAddress, limit = 100) {
  const baseUrl = 'https://api.tzkt.io/v1';
  const headers = {
    'Accept': 'application/json'
  };

  const operations = [];

  // 1. Fetch transfers (simple + contract calls)
  const txRes = await fetch(`${baseUrl}/operations/transactions?anyof.sender.target=${tezosAddress}&limit=${limit}&sort.desc=id`, { headers });
  const txs = await txRes.json();
  operations.push(...txs);

  // 2. Fetch delegations
  const delRes = await fetch(`${baseUrl}/operations/delegations?anyof.sender.newDelegate=${tezosAddress}&limit=${limit}&sort.desc=id`, { headers });
  const dels = await delRes.json();
  operations.push(...dels);

  // 3. Sort by time descending
  operations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const transactions = [];

  const tokenCache = new Map(); // Map of `${contract}_${tokenId}` → metadata

  for (const op of operations) {
    const { command_type, contract_call_entrypoint } = getTezosCommandType(op);  // Get both values

    const totalFee = (op.bakerFee || 0) + (op.storageFee || 0) + (op.allocationFee || 0);

    let sender_key = op.sender?.address || null;
    let receiver_key = op.target?.address || op.newDelegate?.address || null;
    let token_receiver = null;
    let token_amount = null;
    let token_id = null;
    let token_contract = op.target?.address || null;
    let token_name = null;
    let token_decimals = null;
    let token_symbol  = null;
    let token_thumbnail = null;

    // Token transfer detection
    if (op.parameter?.entrypoint === "transfer" && Array.isArray(op.parameter?.value)) {
      const transfers = op.parameter.value;
      if (transfers.length > 0 && transfers[0].txs?.length > 0) {
        const tx = transfers[0].txs[0];
        token_receiver = tx.to_;
        token_amount = tx.amount;
        token_id = tx.token_id;
        receiver_key = token_receiver;
      }
    }

    // Mint detection
    if (op.parameter?.entrypoint === "mint" && op.parameter.value) {
      token_receiver = op.parameter.value.address;
      token_amount = op.parameter.value.amount;
      token_id = op.parameter.value.token_id;
      receiver_key = token_receiver;
    }

    // Fetch token metadata (once per contract/token_id)
    if (token_contract && token_id !== null) {
      const tokenKey = `${token_contract}_${token_id}`;
      if (!tokenCache.has(tokenKey)) {
        try {
          const res = await fetch(`https://api.tzkt.io/v1/tokens?contract=${token_contract}&tokenId=${token_id}`);
          const meta = await res.json();
          if (meta.length > 0) {
            tokenCache.set(tokenKey, {
              name: meta[0].metadata?.name || null,
              symbol: meta[0].metadata?.symbol || null,
              decimals: meta[0].metadata?.decimals || null,
              thumbnail: meta[0].metadata?.thumbnailUri || meta[0].metadata?.displayUri || null
            });
          } else {
            tokenCache.set(tokenKey, { name: null, decimals: null });
          }
        } catch (err) {
          console.warn(`Error fetching token metadata for ${tokenKey}:`, err);
          tokenCache.set(tokenKey, { name: null, decimals: null });
        }
      }
      const cachedMeta = tokenCache.get(tokenKey);
      token_name = cachedMeta?.name;
      token_decimals = cachedMeta?.decimals;
      token_symbol = cachedMeta?.symbol;
      token_thumbnail = cachedMeta?.thumbnail;
    }

    const baseTx = {
      blockchain: 'tezos',
      block_id: op.level,
      height: op.level,
      timestamp: new Date(op.timestamp).getTime().toString(),
      hash: op.hash,
      amount: op.amount ? op.amount.toString() : "0",
      fee: totalFee.toString(),
      memo: "",
      status: op.status === "applied" ? "applied" : "failed",
      failure_reason: op.status === "applied" ? null : (op.errors?.[0]?.message || "unknown_error"),
      sender_key: sender_key,
      receiver_key: receiver_key,
      sender_name: op.sender?.alias || "noname",
      receiver_name: op.target?.alias || op.newDelegate?.alias || "noname",
      fee_payer_key: sender_key,
      chain_status: "canonical",
      block_hash: op.block || null,
      token_contract: token_contract,
      token_receiver: token_receiver,
      token_amount: token_amount,
      token_name: token_name,
      token_symbol: token_symbol,
      token_thumbnail: token_thumbnail,
      token_decimals: token_decimals,      
      command_type: command_type,  // Always set as contract_call if it's a contract call
      contract_call_entrypoint: contract_call_entrypoint,  // Store the specific entrypoint here
      label: command_type,
      r_thief: 0, s_thief: 0,
      r_scammer: 0, s_scammer: 0,
      r_spammer: 0, s_spammer: 0
    };


    transactions.push(baseTx);
  }

  // 2. Fetch FA2 token transfers (independent of contract calls)
  const tokenRes = await fetch(`${baseUrl}/tokens/transfers?anyof.from.to=${tezosAddress}&limit=${limit}&sort.desc=timestamp`, { headers });
  const tokenTransfers = await tokenRes.json();

  // Optional: push tokenTransfers into a second loop or convert to the same structure
  for (const tf of tokenTransfers) {
    const tokenKey = `${tf.token.contract.address}_${tf.token.tokenId}`;
    if (!tokenCache.has(tokenKey)) {
      try {
        const res = await fetch(`https://api.tzkt.io/v1/tokens?contract=${tf.token.contract.address}&tokenId=${tf.token.tokenId}&sort.desc=timestamp`);
        const meta = await res.json();
        tokenCache.set(tokenKey, {
          name: meta[0]?.metadata?.name || null,
          symbol: meta[0]?.metadata?.symbol || null,
          decimals: meta[0]?.metadata?.decimals || null,
          thumbnail: meta[0]?.metadata?.thumbnailUri || meta[0]?.metadata?.displayUri || null
        });
      } catch {
        tokenCache.set(tokenKey, { name: null, symbol: null, decimals: null, thumbnail: null });
      }
    }
    const cachedMeta = tokenCache.get(tokenKey);

    transactions.push({
      blockchain: 'tezos',
      block_id: tf.level,
      height: tf.level,
      timestamp: new Date(tf.timestamp).getTime().toString(),
      hash: tf.transactionHash,
      amount: "0",
      fee: "0",
      memo: "",
      status: "applied",
      failure_reason: null,
      sender_key: tf.from?.address || null,
      receiver_key: tf.to?.address || null,
      sender_name: tf.from?.alias || "noname",
      receiver_name: tf.to?.alias || "noname",
      fee_payer_key: tf.from?.address || null,
      chain_status: "canonical",
      block_hash: null,
      token_contract: tf.token.contract.address,
      token_receiver: tf.to?.address || null,
      token_amount: tf.amount,
      token_name: cachedMeta?.name,
      token_symbol: cachedMeta?.symbol,
      token_thumbnail: cachedMeta?.thumbnail,
      token_decimals: cachedMeta?.decimals,
      command_type: "token_transfer",
      label: "token_transfer",
      r_thief: 0, s_thief: 0,
      r_scammer: 0, s_scammer: 0,
      r_spammer: 0, s_spammer: 0
    });
  }



  return transactions;
}


async function fetchTransactionsFromAlchemy(publicKey, blockchain, limit) {
  const baseUrls = {
    ethereum: `https://eth-mainnet.g.alchemy.com/v2/`,
    polygon: `https://polygon-mainnet.g.alchemy.com/v2/`,
    bsc: `https://bnb-mainnet.g.alchemy.com/v2/`,
    solana: `https://solana-mainnet.g.alchemy.com/v2/`,
    zksync: `https://zksync-mainnet.g.alchemy.com/v2/`,
    optimism: `https://opt-mainnet.g.alchemy.com/v2/`,
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/`,
    cronos: `https://api.cronoscan.com/api`,  // pour cohérence
    tezos: `https://api.tzkt.io/v1`,
    base: `https://base-mainnet.g.alchemy.com/v2/`
  };

  const encodedTargetUrl = encodeURIComponent(`${baseUrls[blockchain]}`);
  const url = `https://www.akirion.com:4664/proxy?url=${encodedTargetUrl}`;
  const apiKeyHeader = { 'x-api-key': '2c57fa11-3463-47fa-802d-116c2dfff660' };
  const toMillis = iso => iso ? new Date(iso).getTime().toString() : null;

  console.log(`Calling ${blockchain.toUpperCase()}Scan API`);

  if (blockchain === 'solana') {
    return await fetchSolanaTransactions(publicKey, limit, url);
  }

  if (blockchain === 'cronos') {
    return await fetchCronosTransactions(publicKey, limit, url);
  }
  if (blockchain === 'tezos') {
    return await fetchTezosTransactions(publicKey, limit);
  }  
  // Set category for ETH, POLYGON, BSC
  /*let category = ["external", "erc20"];
  if (blockchain === "ethereum" || blockchain === "polygon") {
    category.push("internal", "erc721", "erc1155");
  }
  if (blockchain === "zksync"  || blockchain === "optimism" || blockchain === "arbitrum" || blockchain === "cronos" || blockchain === "base" ) {
    category.push("erc721", "erc1155");
  }*/

  const categoryByChain = {
    ethereum:      ["external", "internal", "erc20", "erc721", "erc1155"],
    polygon:       ["external", "internal", "erc20", "erc721", "erc1155"],
    bsc:           ["external", "erc20", "erc721", "erc1155"],
    optimism:      ["external", "erc20", "erc721", "erc1155"],
    arbitrum:      ["external", "erc20", "erc721", "erc1155"],
    zksync:        ["external", "erc20", "erc721", "erc1155"], // no "internal"
    base:          ["external", "erc20", "erc721", "erc1155"], // no "internal"
    cronos:        ["external", "erc20", "erc721", "erc1155"],                      // basic support
  };

  const category = categoryByChain[blockchain] || ["external"];


  // Setup query parameters for both directions
  const baseParams = {
    fromBlock: "0x0",
    toBlock: "latest",
    category,
    withMetadata: true,
    maxCount: `0x${limit.toString(16)}`,
    order: "desc",
    excludeZeroValue: false
  };

  const toParams = { ...baseParams, toAddress: publicKey };
  const fromParams = { ...baseParams, fromAddress: publicKey };

  const [toRes, fromRes] = await Promise.all([
    fetch(url, {
      method: "POST",
      headers: { ...apiKeyHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 0,
        method: "alchemy_getAssetTransfers",
        params: [toParams]
      })
    }),
    fetch(url, {
      method: "POST",
      headers: { ...apiKeyHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getAssetTransfers",
        params: [fromParams]
      })
    })
  ]);

  const [toJson, fromJson] = await Promise.all([toRes.json(), fromRes.json()]);
  const transfers = [...(toJson?.result?.transfers || []), ...(fromJson?.result?.transfers || [])];

  // Deduplicate by tx.hash
  const seen = new Set();
  const uniqueTransfers = transfers.filter(tx => {
    const id = tx.uniqueId || tx.hash;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // Enrich with contract creation / call info
  const enriched = await Promise.all(uniqueTransfers.map(async (tx) => {
    const receiptBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionReceipt",
      params: [tx.hash]
    };

    let receiptData = null;
    try {
      const receiptRes = await fetch(url, {
        method: "POST",
        headers: { ...apiKeyHeader, "Content-Type": "application/json" },
        body: JSON.stringify(receiptBody)
      });
      const receiptJson = await receiptRes.json();
      receiptData = receiptJson?.result;
    } catch (err) {
      console.warn(`Receipt fetch failed for tx ${tx.hash}`, err.message);
    }

    const contractFromLogs = receiptData?.logs?.[0]?.address?.toLowerCase() || null;
    const contractAddress = receiptData?.contractAddress?.toLowerCase() || contractFromLogs;

    const nativeAssets = {
      ethereum: "ETH",
      polygon: "MATIC",
      bsc: "BNB",
      zksync: "ETH",
      optimism: "ETH",
      arbitrum: "ETH",
      cronos: "ETH",
      tezos: "XTZ",
      base: "ETH",
    };

    const isNativeTransfer = (
      tx.category?.includes("external") &&
      tx.asset?.toUpperCase() === nativeAssets[blockchain]
    );

    // ❗ NE PAS se baser sur receipt.contractAddress seul
    const isContractCreation =
      receiptData?.to === null &&
      tx.from?.toLowerCase() === receiptData?.from?.toLowerCase() &&
      tx.rawContract?.address?.toLowerCase() === receiptData?.contractAddress?.toLowerCase();

    const hasTokenContract = !!tx.rawContract?.address;
    const isTokenTransfer = !isContractCreation && hasTokenContract;

    let command_type = "contract_call";

    if (isContractCreation) {
      command_type = "contract_creation";
    } else if (isNativeTransfer) {
      command_type = "transfer";
    } else if (tx.category?.includes("erc1155")) {
      command_type = "token_transfer";
    } else if (tx.category?.includes("erc721")) {
      command_type = "nft_transfer";
    } else if (isTokenTransfer) {
      command_type = "token_transfer";
    }

    const tokenAmount =
      tx.erc1155Metadata?.[0]?.value
        ? parseInt(tx.erc1155Metadata[0].value, 16).toString()
        : tx.category?.includes("erc721") && (tx.tokenId || tx.erc721TokenId)
          ? "1"
          : tx.rawContract?.value || null;



    const tokenId = tx.erc721TokenId || tx.tokenId || null;

    console.log("token amount", tokenAmount);

    const gasUsed = receiptData?.gasUsed ? BigInt(receiptData.gasUsed) : 0n;
    const gasPrice = receiptData?.effectiveGasPrice ? BigInt(receiptData.effectiveGasPrice) : 0n;
    const decimals = getDecimalsForBlockchain(blockchain);
    const fee = gasUsed * gasPrice;
    const feeFloat = Number(fee) / 10 ** decimals;
    const formattedFee = feeFloat.toFixed(2);

    if (receiptData.from == null || receiptData.to == null || true) {
      console.warn("tx data : ",tx);
      console.warn("receiptdata : ",receiptData);
    }

    return {
      blockchain,
      block_id: parseInt(tx.blockNum, 16),
      height: parseInt(tx.blockNum, 16),
      timestamp: toMillis(tx.metadata?.blockTimestamp),
      timestamp_iso: tx.metadata?.blockTimestamp || null,
      hash: tx.hash,
      amount: tx.value ? (parseFloat(tx.value)).toString() : "0",
      fee: formattedFee,
      memo: "",
      status: "applied",
      sender_key: tx.from?.toLowerCase() || null,
      receiver_key: tx.to?.toLowerCase() || null,
      sender_name: tx.from ? tx.from.slice(0, 6) + "..." + tx.from.slice(-4) : "unknown",
      receiver_name: tx.to ? tx.to.slice(0, 6) + "..." + tx.to.slice(-4) : "unknown",
      command_type,
      label: command_type,
      token_contract: tx.rawContract?.address ? tx.rawContract.address.toLowerCase() : null,
      token_receiver: tx.to?.toLowerCase() || null,
      token_amount: tokenAmount,
      token_name: tx.asset || null,
      token_decimals: tx.category === "erc1155" || tx.category === "erc721" ? 0 : tx.rawContract?.decimals || null,
      token_id: tokenId,
      // 📦 Nouveaux champs enrichis depuis receipt :
      block_hash: receiptData?.blockHash || null,
      gas_used: receiptData?.gasUsed || null,
      gas_price: receiptData?.effectiveGasPrice || null,
      receipt_from: receiptData?.from?.toLowerCase() || null,
      receipt_to: receiptData?.to?.toLowerCase() || null,
      receipt_contract_address: contractAddress,
      receipt_logs: receiptData?.logs || []      
    };
  }));

  return enriched;
}



async function fetchTransactionsForKey2(publicKey, blockchain = selectedBlockchain, delay = 0) {
    const normalizedKey = blockchain === "polygon" ? publicKey.toLowerCase() : publicKey;
    
    if (normalizedKey === "genesis") 
      return;
    
    delay = delayByBlockchain[blockchain] || delay;
    console.log("selectedBlockchain : ", selectedBlockchain);
    console.log("Normalized Key : ", normalizedKey);

    const chain = blockchain;
    if (!visitedKeysByChain.has(chain)) {
      visitedKeysByChain.set(chain, new Set());
    }
    const visitedForChain = visitedKeysByChain.get(chain);

    if (visitedForChain.has(normalizedKey)) return [];
    visitedForChain.add(normalizedKey);

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


        } else if (blockchain === 'ethereum') {
            const etherscanApiKey = API_TOKEN;
          const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${etherscanApiKey}`;

            console.log("Calling Etherscan API");

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Etherscan API error: ${res.status} ${res.statusText}`);
            }

            const json = await res.json();
          
          if (!json || !json.result) {
                throw new Error("Unexpected response format from EtherScan API");
            }

            log_api_call (blockchain);
            
          if (json.status === "0" && json.message === "No transactions found") {
            console.log(`No transactions found for ${normalizedKey} on ${blockchain.toUpperCase()}.`);
            transactions = []; // Just return empty
          } else if (json.status === "1") {
            log_api_call(blockchain);

          transactions = [];

          for (const tx of json.result) {
            const isContractCreation = !tx.to;
            const isTokenTransfer = tx.input && tx.input.startsWith("0xa9059cbb");
              let tokenReceiver = null;
              let tokenAmount = null;
              let tokenName = null;
              let tokenDecimals = null;              
              
            if (isTokenTransfer && tx.input.length >= 138) {
                  try {
                tokenReceiver = "0x" + tx.input.slice(34, 74);
                tokenAmount = BigInt("0x" + tx.input.slice(74, 138)).toString();
                      const tokenInfo = getKnownTokenInfo(tx.to);
                      if (tokenInfo) {
                  tokenName = tokenInfo.symbol;
                  tokenDecimals = tokenInfo.decimals;
                  console.log(tokenInfo);
                      }
                  } catch (err) {
                      console.warn(`Failed to parse ERC20 input for tx ${tx.hash}`);
                  }
              }              

            const baseTx = {
                blockchain: blockchain,
                block_id: parseInt(tx.blockNumber),
                height: parseInt(tx.blockNumber),
                timestamp: `${parseInt(tx.timeStamp) * 1000}`,
                hash: tx.hash,
                nonce: tx.nonce,
                fee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
                memo: "",
                sequence_no: null,
                status: tx.isError === "0" ? "applied" : "failed",
                failure_reason: tx.isError === "0" ? null : "error",
                confirm: null,
                sender_id: null,
                sender_key: tx.from.toLowerCase(),
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
              token_amount: tokenAmount,
              token_name: tokenName,
              token_decimals: tokenDecimals          
            };
                
            if (isTokenTransfer) {
              // 1. First record: the contract execution itself
              transactions.push({
                ...baseTx,
                command_type: "contract_call",
                amount: tx.value,
                sender_name: "noname",
                receiver_id: null,
                receiver_key: tx.to.toLowerCase(),
                receiver_name: "noname",
                label: "contract_call",
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals   
              });

              // 2. Second record: the token transfer itself
              transactions.push({
                ...baseTx,
                command_type: "token_transfer",
                amount: "0", // direct token transfers don't move native ETH
                sender_name: "noname",
                receiver_id: null,
                receiver_key: tokenReceiver ? tokenReceiver.toLowerCase() : "unknown",
                receiver_name: tokenReceiver ? tokenReceiver.toLowerCase().slice(0,6) + "..." + tokenReceiver.toLowerCase().slice(-6) : "unknown",
                label: "token_transfer",
                token_contract: tx.to ? tx.to.toLowerCase() : null,
                token_receiver: tokenReceiver ? tokenReceiver.toLowerCase() : null,
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals
            });
            } else {
              // Simple ETH transfer or contract call
              transactions.push({
                ...baseTx,
                command_type: tx.input && tx.input !== "0x" ? "contract_call" : "transfer",
                amount: tx.value,
                sender_name: "noname",
                receiver_id: null,
                receiver_key: isContractCreation ? tx.from.toLowerCase() : tx.to.toLowerCase(),
                receiver_name: isContractCreation ? "contract_creation" : "noname",
                label: tx.input && tx.input !== "0x" ? "contract_call" : "payment",
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals   
              });
            }
          }
          }
        } else if (blockchain === 'polygon' || blockchain === 'bsc') {
          const apiKey = API_TOKEN;
          const apiBaseUrl = blockchain === 'polygon'
            ? 'https://api.polygonscan.com'
            : 'https://api.bscscan.com';
            
            const encodedTargetUrl = encodeURIComponent(
            `${apiBaseUrl}/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${apiKey}`
            );

          const url = blockchain === 'polygon'
            ? `${apiBaseUrl}/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${apiKey}`
            : `https://www.akirion.com:4664/proxy?url=${encodedTargetUrl}`; // Use proxy for BSC
        
          console.log(`Calling ${blockchain.toUpperCase()}Scan API`);

            const res = await fetch(url, {
            headers: blockchain === 'bsc' ? {
                    'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
              'Content-Type': 'application/json'
            } : {}
            });
            
            if (!res.ok) {
            throw new Error(`${blockchain.toUpperCase()}Scan API error: ${res.status} ${res.statusText}`);
            }

            const json = await res.json();
          // 🛡️ Proper handling if "no transactions found"
          if (!json || !json.result) {
            throw new Error(`Unexpected response format from ${blockchain.toUpperCase()}Scan API`);
            }

          if (json.status === "0" && json.message === "No transactions found") {
            console.log(`No transactions found for ${normalizedKey} on ${blockchain.toUpperCase()}.`);
            transactions = []; // Just return empty
          } else if (json.status === "1") {
            log_api_call (blockchain);

          transactions = [];

          for (const tx of json.result) {
            const isContractCreation = !tx.to;
            const isTokenTransfer = tx.input && tx.input.startsWith("0xa9059cbb");
            let tokenReceiver = null;
            let tokenAmount = null;
            let tokenName = null;
            let tokenDecimals = null;

            if (isTokenTransfer && tx.input.length >= 138) {
              try {
                tokenReceiver = "0x" + tx.input.slice(34, 74);
                tokenAmount = BigInt("0x" + tx.input.slice(74, 138)).toString();
                const tokenInfo = getKnownTokenInfo(tx.to); // You already have this for Ethereum
                if (tokenInfo) {
                  tokenName = tokenInfo.symbol;
                  tokenDecimals = tokenInfo.decimals;
                  console.log(tokenInfo);
                }
              } catch (err) {
                console.warn(`Failed to parse ERC20 input for tx ${tx.hash}`);
              }
            }

            const baseTx = {
                blockchain: blockchain,
                block_id: parseInt(tx.blockNumber),
                height: parseInt(tx.blockNumber),
                timestamp: `${parseInt(tx.timeStamp) * 1000}`,
                hash: tx.hash,
                nonce: tx.nonce,
                fee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
                memo: "",
                sequence_no: null,
                status: tx.isError === "0" ? "applied" : "failed",
                failure_reason: tx.isError === "0" ? null : "error",
                confirm: null,
                sender_id: null,
                sender_key: tx.from.toLowerCase(),
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
              token_amount: tokenAmount,
              token_name: tokenName,
              token_decimals: tokenDecimals
              };

            if (isTokenTransfer) {
              // 1. Contract execution
              transactions.push({
                ...baseTx,
                command_type: "contract_call",
                amount: tx.value,
                sender_name: "noname",
                receiver_id: null,
                receiver_key: tx.to.toLowerCase(),
                receiver_name: "noname",
                label: "contract_call",
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals
            });

              // 2. Token transfer
              transactions.push({
                ...baseTx,
                command_type: "token_transfer",
                amount: "0", // Token transfers do not move native coins
                sender_name: "noname",
                receiver_id: null,
                receiver_key: tokenReceiver ? tokenReceiver.toLowerCase() : "unknown",
                receiver_name: tokenReceiver ? tokenReceiver.toLowerCase().slice(0,6) + "..." + tokenReceiver.toLowerCase().slice(-6) : "unknown",
                label: "token_transfer",
                token_contract: tx.to ? tx.to.toLowerCase() : null,
                token_receiver: tokenReceiver ? tokenReceiver.toLowerCase() : null,
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals
              });
            } else {
              transactions.push({
                ...baseTx,
                command_type: tx.input && tx.input !== "0x" ? "contract_call" : "transfer",
                amount: tx.value,
                sender_name: "noname",
                receiver_id: null,
                receiver_key: isContractCreation ? tx.from.toLowerCase() : tx.to.toLowerCase(),
                receiver_name: isContractCreation ? "contract_creation" : "noname",
                label: tx.input && tx.input !== "0x" ? "contract_call" : "payment",
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals
              });
            }
          }
          } else {
             throw new Error(`Error from ${blockchain.toUpperCase()}Scan API: ${json.message || "Unknown error"}`);
          }
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
              if (tx.meta && tx.meta.preToken && tx.meta.postToken) {
                const receiverIndex = accountKeys.findIndex(k => k.pubkey === receiverKey);
                if (receiverIndex >= 0) {
                  const pre = tx.meta.preToken[receiverIndex] || 0;
                  const post = tx.meta.postToken[receiverIndex] || 0;
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
        console.error("Error occurred:", error);
        cancelRequested = true;
        hideLoader();
        showErrorPopup(error.message || "An unknown error occurred");
        return transactions || [];
    }
}

async function fetchTransactionsForKey(publicKey, blockchain = selectedBlockchain, delay = 0) {
    const normalizedKey = ["polygon", "ethereum", "bsc", "zksync", "optimism","arbitrum","base"].includes(blockchain)
      ? publicKey.toLowerCase()
      : publicKey;    
      
    if (normalizedKey === "genesis") 
      return;
    
    delay = delayByBlockchain[blockchain] || delay;
    console.log("selectedBlockchain : ", selectedBlockchain);
    console.log("Normalized Key : ", normalizedKey);

  const chain = blockchain;
  if (!visitedKeysByChain.has(chain)) {
    visitedKeysByChain.set(chain, new Set());
  }
  const visitedForChain = visitedKeysByChain.get(chain);

  if (visitedForChain.has(normalizedKey)) return [];
  visitedForChain.add(normalizedKey);

  let limit;

  if (blockchain === "mina") {
    limit = (normalizedKey.toLowerCase() === BASE_KEY.toLowerCase())
      ? FIRST_ITERATION_LIMIT
      : LIMIT;
  } else {
    limit = (normalizedKey.toLowerCase() === BASE_KEY.toLowerCase())
      ? Math.floor(FIRST_ITERATION_LIMIT / 2)
      : Math.floor(LIMIT / 2);
  }

  limit = Math.max(1, Math.floor(limit)); // évite un limit de 0 ou inférieur


    console.log("normalizedKey=",normalizedKey, " | BASEKEY=",BASE_KEY);

    try {
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        let transactions = [];

        //log_api_call(blockchain);

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


        }  else if (["ethereum", "polygon", "bsc", "solana", "zksync", "optimism","arbitrum","cronos", "tezos", "base"].includes(blockchain)) {
          transactions = await fetchTransactionsFromAlchemy(normalizedKey, blockchain, limit);
        }

        console.log(transactions);

        currentStep++;
        updateProgressBar(currentStep, totalSteps);
        return transactions;

    } catch (error) {
    console.warn("⚠️ Error during fetch, continuing anyway:", error.message || error);
    
    // Optionnel : log visible pour debugging si debugLevel >= 2
    console.warn(`⚠️ Error fetching tx for ${normalizedKey}: ${error.message}`);

    // On continue le processus même en cas d'échec
    return typeof transactions !== "undefined" ? transactions : [];
    }
}

async function buildGraphRecursively(publicKey, depth, level = 0, chainOverride = null) {
  const chain = chainOverride || selectedBlockchain;

  const normalizedKey = ["polygon", "ethereum", "bsc", "zksync", "optimism", "arbitrum", "cronos", "base"].includes(chain)
    ? publicKey.toLowerCase()
    : publicKey;
    
  if (normalizedKey === "genesis") return;
  if (!window.initialPublicKey) window.initialPublicKey = normalizedKey;

  if (depth < 0 || cancelRequested) return;

  // Init visitedKeysByChain[chain]
  if (!visitedKeysByChain.has(chain)) {
    visitedKeysByChain.set(chain, new Set());
  }
  const visitedForChain = visitedKeysByChain.get(chain);
  
  if (visitedForChain.has(normalizedKey)) return;  

  log_api_call(chain);
    
  while (pause) await new Promise(r => setTimeout(r, 100));
  const transactions = await fetchTransactionsForKey(normalizedKey, chain, 1000);

  transactionsByNeighbor[normalizedKey] = transactions; // ✅ ici

  appendLoaderLog(`🔄 Loaded ${transactions.length} tx for ${normalizedKey.slice(0, 4)}…${normalizedKey.slice(-4)} on ${chain} depth ${level}`);

  const isValidEdge = (tx) => tx?.sender_key && tx?.receiver_key; // && tx.sender_key !== tx.receiver_key;

  const addOrUpdateNode = (key, name, chain) => {
    if (!graph.hasNode(key)) {
      graph.addNode(key, {
        label: `${name !== "noname" ? name : "Address"} (${key.slice(0, 6)}…${key.slice(-6)})`,
        name,
        chains: [chain],
        x: Math.random() * 1000,
        y: Math.random() * 1000
      });
    } else {
      const existingChains = graph.getNodeAttribute(key, 'chains') || [];
      if (!existingChains.includes(chain)) {
        graph.setNodeAttribute(key, 'chains', [...existingChains, chain]);
      }
    }
  };

  for (const tx of transactions) {
    const sender = tx.sender_key;
    const receiver = tx.receiver_key;
    
    if (tx.command_type === "stake") {
      console.warn("🌱 Stake tx detected:", tx);
    }
    
    if (!isValidEdge(tx)) {
      console.warn(`⚠️ Skipping tx with missing or invalid sender/receiver:`, tx);
      continue;
    }    
    
    const senderName = tx.sender_name;
    const receiverName = tx.receiver_name;
    const txChain = tx.blockchain || chain;

    addOrUpdateNode(sender, senderName, txChain);
    addOrUpdateNode(receiver, receiverName, txChain);

    const edgeId = `${tx.hash}-${tx.command_type}-${sender}-${receiver}-${tx.nonce}`;
    const edgeColor =
        tx.command_type === "token_transfer" || tx.command_type === "nft_transfer"
        ? "#f9a825" // 🟨 Dark Yellow for token transfers
        : tx.status === "applied"
          ? "#ccc"  // Light grey for normal applied tx
          : "#f66"; // Red for failed

    if (!graph.hasEdge(edgeId)) {
      const timestamp = parseInt(tx.timestamp); // parse to ensure it's a number
      graph.addEdgeWithKey(edgeId, sender, receiver, {
        label: tx.command_type,
        command_type: tx.command_type,
        contract_call_entrypoint: tx.contract_call_entrypoint ? tx.contract_call_entrypoint : null,  // Store the specific entrypoint here
        status: tx.status,
        sender_key: tx.sender_key,
        receiver_key: tx.receiver_key,
        sender_name: tx.sender_name,
        receiver_name: tx.receiver_name,
        timestamp: timestamp,
        fee: tx.fee,
        amount: tx.amount,
        block_id: tx.block_id,
        block_hash: tx.block_hash,
        memo: tx.memo,
        blockchain: txChain,
        token_contract: tx.token_contract,
        token_receiver: tx.token_receiver,
        token_amount: tx.token_amount,        
        token_name: tx.token_name,
        token_decimals: tx.token_decimals,
        color: edgeColor,
        hash: tx.hash 
      });
    }
  }

  // 🎨 Node coloring
  if (["polygon", "ethereum", "bsc", "solana", "zksync", "optimism", "arbitrum", "cronos", "tezos", "base"].includes(chain)) {
    const degrees = graph.nodes().map(n => graph.degree(n));
    const minDeg = Math.min(...degrees);
    const maxDeg = Math.max(...degrees);

    graph.forEachNode((node) => {
      const degree = graph.degree(node);
      
      const chains = graph.getNodeAttribute(node, 'chains') || [chain];
      const primaryChain = chains[0];
      const color = getColorByDegree(degree, minDeg, maxDeg, primaryChain, chains.length);
      
      //const color = getColorByDegree(degree, minDeg, maxDeg);
      //console.log(degree," : ",color);
      graph.setNodeAttribute(node, 'colorByDegree', color);
      graph.setNodeAttribute(node, 'originalColor', color);
    });
  } else if (chain === "mina") {
    graph.forEachNode(node => {
      const name = graph.getNodeAttribute(node, 'name') || "noname";
      const color = getBrightColorByName(name);
      graph.setNodeAttribute(node, 'colorByDegree', color);
      graph.setNodeAttribute(node, 'originalColor', color);
    });
  }

  // Prepare next keys
  const normalize = (key) =>
    ["polygon", "ethereum", "bsc", "zksync", "optimism", "arbitrum", "cronos", "base"].includes(chain)
      ? key?.toLowerCase()
      : key;

  const nextKeys = [...new Set(
    transactions.flatMap(t => [
      normalize(t.receiver_key),
      normalize(t.sender_key)
    ]).filter(k => k && k !== normalizedKey)
  )];



  visitedForChain.add(normalizedKey);

  /*for (const t of transactions) {
    const rk = t.receiver_key;
    if (!rk) continue;
    
    const rkLower = rk.toLowerCase();
    const isSame = rkLower === normalizedKey;

    if (isSame) {
      console.warn("⚠️ Receiver equals normalizedKey after toLowerCase:");
      console.warn("  → receiver_key (original):", rk);
      console.warn("  → normalizedKey:", normalizedKey);
    } else {
      console.log("📬 New candidate receiver:", rk, "→", rkLower);
    }
  }*/

  totalSteps += nextKeys.length;
  updateProgressBar(currentStep, totalSteps);
  
  for (const k of nextKeys) {
    if (cancelRequested) break;
    await buildGraphRecursively(k, depth - 1, level + 1, chain);
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

  // Clear selection *before* deletion
  if (selectedNode === nodeId) selectedNode = null;
  if (hoveredNode === nodeId) hoveredNode = null;

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
    // Extra safety before deleting
    if (selectedNode === n) selectedNode = null;
    if (hoveredNode === n) hoveredNode = null;
    if (graph.hasNode(n)) graph.dropNode(n);
  });

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
  try {
    if (!amount) return "0";

    // Convert hex if necessary
    if (typeof amount === "string" && amount.startsWith("0x")) {
      amount = BigInt(amount);
    } else if (typeof amount === "string" && /^[0-9]+$/.test(amount)) {
      amount = BigInt(amount);
    } else if (typeof amount === "number" && Number.isInteger(amount)) {
      amount = BigInt(amount);
    } else {
      // If it's a decimal number, return it as is (assuming it's already formatted)
      return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      });
    }

    const divisor = BigInt(10) ** BigInt(decimals);
    const result = Number(amount) / Number(divisor);

    return result.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });

  } catch (e) {
    console.warn("Invalid token amount:", amount, e);
    return "0";
  }
}

async function fetchMoreForNode(key, chain = selectedBlockchain) {
  const visitedSet = visitedKeysByChain.get(chain) || new Set();
  
  cancelRequested = false;
  
  if (visitedSet.has(key)) {
    alert(`This node was already fetched for ${capitalize(chain)}.`);
    return;
  }

  const previousInitialKey = BASE_KEY;
  const initialFirstLimit = FIRST_ITERATION_LIMIT;
  const initialLimit = LIMIT;
  
  BASE_KEY = key;
  FIRST_ITERATION_LIMIT = parseInt(document.getElementById("param-first-iteration").value, 10);;
  LIMIT = 0;
  showOverlaySpinner(chain, FIRST_ITERATION_LIMIT);  // ⬅️ Show fullscreen spinner
  //showLoader();
  await buildGraphRecursively(key, 0, 0, chain); // 👉 passe `chain`
  applyNodeSizesByDegree();
  setupReducers();
  rebuildTransactionsByNeighbor();
  setupDateSlicer(); // ✅ Update the slicer to reflect new edges
  if (isLayoutRunning) {
    stopLayoutInWorker();
    layoutBtn.textContent = "Apply Layout";
    isLayoutRunning = false;
  }  
  renderer.refresh();
  //hideLoader();
  hideOverlaySpinner();       // ⬅️ Hide spinner overlay
  showNodePanel(key); // 🔁 Refresh node panel after fetch
  animateLayout();

  BASE_KEY = previousInitialKey;
  //FIRST_ITERATION_LIMIT = initialFirstLimit;
  LIMIT = initialLimit;
}



function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getChainIcon(chain) {
  return blockchainSVGs[chain] || "";
}

function showNodePanel(node) {
  //rebuildTransactionsByNeighbor();
  const panel = document.getElementById("side-panel");
  const data = graph.getNodeAttributes(node);
  const neighbors = graph.neighbors(node);
  
  document.getElementById("side-panel").classList.add("open");
  
  selectedNode = node;

  let tx = 0, del = 0, failed = 0, sc = 0, tt = 0;
  graph.forEachEdge((e, attr, src, tgt) => {
    if (src === node || tgt === node) {
      if (attr.status !== "applied") failed++;
          else if (attr.command_type === "delegation") del++;
          else if (attr.command_type === "stake" || attr.command_type === "delegate") del++;
          else if (attr.command_type === "payment" || attr.command_type === "transfer") tx++;
          else if (attr.command_type === "contract_call" || attr.command_type === "zkapp" || attr.command_type === "contract_creation") sc++;
          else if (attr.command_type === "token_transfer" || attr.command_type === "nft_transfer") tt++;
    }
  });


  const evmChains = ["ethereum", "polygon", "bsc", "zksync", "optimism", "arbitrum", "cronos", "base"];
  const strictChains = ["mina", "solana", "tezos"];

  const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(node);
  const isTezosAddress = /^(tz[1-3]|KT1)[a-zA-Z0-9]{33}$/.test(node); // include tz1-3 and KT1
  const isMinaAddress = /^B62[a-zA-Z0-9]{52}$/.test(node);
  const isSolanaAddress =
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(node) &&
    !isTezosAddress && !isMinaAddress && !isEvmAddress; // avoid false positives

  let compatibleChains = [];

  if (isMinaAddress) compatibleChains = ["mina"];
  else if (isTezosAddress) compatibleChains = ["tezos"];
  else if (isSolanaAddress) compatibleChains = ["solana"];
  else if (isEvmAddress) compatibleChains = evmChains;

  const chainsToFetch = compatibleChains.filter(chain => {
    const visitedSet = visitedKeysByChain.get(chain) || new Set();
    return !visitedSet.has(node);
  });

  let fetchButtonsHTML = "";

  if (chainsToFetch.length === 0) {
    fetchButtonsHTML = `<p style="font-size: 12px; color: #aaa; margin-top: 4px;">✅ Already fetched for all chains</p>`;
  } else {
    const links = chainsToFetch.map(chain => `
      <a style="color: white; text-decoration: none;" href="#" onclick="fetchMoreForNode('${node}', '${chain}'); return false;"
         title="Fetch from ${capitalize(chain)}"
         style="margin-right: 4px; vertical-align: middle;">
        <img src="img/${chain}.png" 
          alt="${chain} icon"
          style="width: 32px; height: 32px; margin-right: 4px; vertical-align: middle;" />
      </a>`).join("");

    fetchButtonsHTML = `
      <p style="margin-top: 4px; margin-bottom: 0px; font-size: 14px;">
        ${links}
      </p>`;
  }


  //console.log('transactionsByNeighbor keys:', Object.keys(transactionsByNeighbor));
  //console.log('Looking for node:', node);
  //neighbors.forEach(n => {
  //  console.log('Looking for neighbor:', n);
  //});
  
  const html = `
    <h3 style="display: flex; align-items: center; gap: 10px;">
      <a href="${getExplorerURL('account', node, selectedBlockchain)}" target="_blank" style="color:#4fc3f7">
        ${data.label}
      </a>
      <span id="favorite-status"></span>
      <span id="watch-status"></span>
    </h3>      
    <button onclick="deleteSelectedNode('${node}')" title="Delete node (Del)" style="
      margin: 5px 0;
      background: #e53935;
      color: white;
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
    ">🗑️ Delete this node from the Graph</button>         
    <p style="margin-bottom: 0px;"><strong>Key:</strong> <span style="font-size: 10px;">${node}</span></p>
    ${fetchButtonsHTML}
    <p><strong>Degree:</strong> ${graph.degree(node)}</p>
    <p><strong>#Transactions:</strong> ${tx}</p>
    <p><strong>#Delegations:</strong> ${del}</p>
    <p><strong>#Smart Contracts:</strong> ${sc}</p>
    <p><strong>#Token Transfers:</strong> ${tt}</p>
    <p><strong>#Failed Transactions:</strong> ${failed}</p>
    <p><strong>Linked Nodes & Transactions:</strong></p>
    <div>
      ${neighbors
        .map(n => {
          const directEdges = graph.edges().filter(e => {
            const source = graph.source(e);
            const target = graph.target(e);
            return (source === node && target === n) || (source === n && target === node);
          });
          const interactions = directEdges.map(e => graph.getEdgeAttributes(e));
          const latestTimestamp = interactions.reduce((max, tx) => Math.max(max, tx.timestamp || 0), 0);
          return { n, latestTimestamp };
        })
        .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
        .map(({ n, latestTimestamp }) => {
        const label = graph.getNodeAttribute(n, 'label');
          const age = Date.now() - (latestTimestamp || 0);
          let recencyBadge = '';

          if (latestTimestamp) {
            if (age < 30 * 24 * 60 * 60 * 1000) {
              recencyBadge = `<span style="color:#00e676; font-size: 10px; margin-left: 6px;">● last 30 days</span>`;
            } else if (age < 365 * 24 * 60 * 60 * 1000) {
              recencyBadge = `<span style="color:#ffee58; font-size: 10px; margin-left: 6px;">● last 365 days</span>`;
            } else {
              recencyBadge = `<span style="color:#90a4ae; font-size: 10px; margin-left: 6px;">● older</span>`;
            }
          }

        const directEdges = graph.edges().filter(e => {
          const source = graph.source(e);
          const target = graph.target(e);
          return (source === node && target === n) || (source === n && target === node);
        });

        const interactions = directEdges.map(e => graph.getEdgeAttributes(e));

          interactions.sort((a, b) => b.timestamp - a.timestamp);

        const txTable = interactions.length > 0 ? `
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
              ${interactions.map(tx => {
                console.log("Tx Hash: ",tx.hash, " | Debug Token Amount:", tx.token_amount, "Raw amount:", tx.amount);
                  const isAlchemyChain = (chain) => ["ethereum", "polygon", "bsc","zksync","optimism","arbitrum", "base"].includes(chain);
                return `
                <tr title="${tx.memo || ''}">
                  <td>${tx.blockchain}</td>
                  <td>${formatTimestamp(tx.timestamp)}</td>
                  <td>
                      ${tx.block_id || tx.block_hash
                        ? `<a href="${getExplorerURL('block', tx.block_hash || tx.block_id, tx.blockchain)}" 
                              target="_blank" rel="noopener noreferrer" style="color: white; text-decoration: none;">
                             ${tx.block_id || tx.block_hash}
                        </a> <span style="font-size: 9px; opacity: 0.7;">🔗</span>`
                      : "-"}
                  </td>                    
                  <td>
                    ${(() => {
                        const isTokenTransfer = ["token_transfer", "nft_transfer"].includes(tx.label);
                      //const link = isTokenTransfer
                      //  ? (tx.token_contract ? getExplorerURL('account', tx.token_contract, tx.blockchain) : "#")
                      //  : (tx.hash ? getExplorerURL('transaction', tx.hash, tx.blockchain) : "#");
                        const link = tx.hash ? getExplorerURL('transaction', tx.hash, tx.blockchain) : getExplorerURL('block', tx.block_hash || tx.block_id, tx.blockchain);           
                        const tlabel = tx.label || "-"; // Default to "-" if no label
                        const entryPoint = tx.contract_call_entrypoint ? `:${tx.contract_call_entrypoint}` : ''; // Check if entrypoint exists and append it
                        // Concatenate the entry point to the label
                        const label = tlabel + entryPoint;
                      return `
                        <a href="${link}" target="_blank" rel="noopener noreferrer" style="color: white; text-decoration: none;">
                          ${label} <span style="font-size: 9px; opacity: 0.7;">🔗</span>
                    </a>
                      `;
                    })()}
                  </td>
                  <td>${isAlchemyChain(tx.blockchain) 
                         ? parseFloat(tx.amount || 0).toFixed(2)
                         : formatAmount(tx.amount, getDecimalsForBlockchain(tx.blockchain))}</td>
                  <td>${isAlchemyChain(tx.blockchain) 
                         ? parseFloat(tx.fee || 0).toFixed(2)
                         : formatAmount(tx.fee, getDecimalsForBlockchain(tx.blockchain))}</td>
                  <td>${tx.status || "-"}</td>
                </tr>
                  ${tx.label === "token_transfer" || tx.label === "nft_transfer" ? `
                  <tr style="opacity: 0.7;">
                    <td colspan="2" style="text-align: right;">
                      Receiver: ${(tx.token_receiver ? `${tx.token_receiver.slice(0,6)}...${tx.token_receiver.slice(-6)}` : "unknown")}
                    </td>
                    <td colspan="5" style="text-align: right;">
                      ${(() => {
                        if (!tx.token_amount) return "-";

                        const decimals = (tx.token_decimals !== undefined && tx.token_decimals !== null)
                          ? tx.token_decimals
                          : (getKnownTokenInfo(tx.token_contract)?.decimals ?? 18);

                        let normalizedAmount;

                        // Case 1: Hex string (e.g., "0x7d2b7500")
                        if (typeof tx.token_amount === "string" && tx.token_amount.startsWith("0x")) {
                          normalizedAmount = BigInt(tx.token_amount).toString(); // Convert hex to decimal string
                        }
                        // Case 2: Number (e.g., 2100) — convert to string
                        else if (typeof tx.token_amount === "number") {
                          normalizedAmount = tx.token_amount.toString();
                        }
                        // Case 3: Already a decimal string (e.g., "2100")
                        else {
                          normalizedAmount = tx.token_amount;
                        }
                        //console.log("Amount : ",normalizedAmount, "| Decimals : ", decimals);
                        return formatTokenAmount(normalizedAmount, decimals);
                      })()} 
                      ${(() => {
                        const tokenLink = tx.token_contract ? getExplorerURL('account', tx.token_contract, tx.blockchain) : "#";
                        let tokenLabel = "UnknownToken";

                        if (tx.token_name) {
                          tokenLabel = tx.token_name;
                        } else {
                          const tokenInfo = getKnownTokenInfo(tx.token_contract);
                          if (tokenInfo) {
                            tokenLabel = tokenInfo.symbol;
                          } else if (tx.token_contract) {
                            tokenLabel = tx.token_contract.slice(0, 6) + "..." + tx.token_contract.slice(-6);
                            console.log ("\"" + tx.token_contract + "\",");
                          }
                        }

                        return `
                          <a href="${tokenLink}" target="_blank" rel="noopener noreferrer" style="color: #f9a825; text-decoration: none;">
                            ${tokenLabel} 🔗
                          </a>
                        `;
                      })()}
                    </td>
                  </tr>` : ""}
              `}).join("")}
            </tbody>
          </table>
        ` : `<p style="color:#888; margin-bottom: 16px;">No direct interactions.</p>`;

        return `
          <div style="margin-bottom: 20px;">
              <div class="linked-node" onclick="showNodePanel('${n}')">
                ${label}${recencyBadge}
              </div>
            <div class="mono">
              ${txTable}
            </div>
          </div>
        `;
      }).join('')}
    </div>`;
    
  details.innerHTML = html;
  
  if (evmChains.includes(selectedBlockchain) || selectedBlockchain==="tezos" || selectedBlockchain==="mina" || selectedBlockchain==="solana") {
    const watchSpan = document.getElementById("watch-status");
    if (!watchSpan) return;

    isWatched(node, selectedBlockchain).then(watched => {
      renderWatchIcon(watchSpan, watched, node, selectedBlockchain);
    });
  }

  const favSpan = document.getElementById("favorite-status");
  const isFav = isFavorite(node, selectedBlockchain);
  renderFavIcon(favSpan, isFav, node, selectedBlockchain);

  
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

  if (selectedBlockchain === "polygon" || selectedBlockchain === "ethereum" || selectedBlockchain === "bsc" || selectedBlockchain === "solana" || selectedBlockchain === "zksync" || selectedBlockchain === "optimism" || selectedBlockchain === "arbitrum" || selectedBlockchain === "cronos" || selectedBlockchain === "tezos" || selectedBlockchain === "base") {
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

    const chains = data.chains instanceof Set ? Array.from(data.chains) : (data.chains || []);
    const chainCount = chains.length;
    const primaryChain = chains[0] || selectedBlockchain;

    if (node === window.initialPublicKey) {
      glowColor = "#FF0000"; // 🔥 Red for the initial key
    } else if (primaryChain === "mina") {
      glowColor = getBrightColorByName(data.name || "noname");
    } else if (chainCount > 1) {
      glowColor = "#ff00ff"; // 🟠 Orange for shared nodes
    } else {
      glowColor = getColorByDegree(graph.degree(node), minDegree, maxDegree, primaryChain, chainCount);
    }

    
    const defaultSize = data.size || 5;
    //console.log("Dans nodeReducer - isLightTheme = " + isLightTheme())


    // 🎯 Filter by command type
    const visibleTypes = expandedCommandTypeFilter();

    const typeMatch = visibleTypes.size === 0 || graph.edges(node).some(e => {
        const command = graph.getEdgeAttribute(e, "command_type") || graph.getEdgeAttribute(e, "label");
        return visibleTypes.has(command);
      });

    // 🎯 Match if at least one chain is in the active filter
    const chainMatch = chainFilter.size === 0 || chains.some(c => chainFilter.has(c));


    if (!typeMatch || !chainMatch) {
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

    const source = graph.source(edge);
    const target = graph.target(edge);
    const sourceNode = graph.getNodeAttributes(source);
    const targetNode = graph.getNodeAttributes(target);

    // Base color by type
    let baseColor = "#666";
    switch (command) {
      case "payment": baseColor = "#4caf50"; break;
      case "transfer": baseColor = "#4caf50"; break;
      case "delegation": baseColor = "#2196f3"; break;
      case "delegate": baseColor = "#2196f3"; break;
      case "stake": baseColor = "#2196f3"; break;
      case "zkapp": baseColor = "#ff57c1"; break;
      case "contract_call": baseColor = "#ff57c1"; break;
      case "contract_creation": baseColor = "#ff57c1"; break;
      case "token_transfer": baseColor = "#f9a825"; break;
      case "nft_transfer": baseColor = "#f9a825"; break;
    }

    // Filter by command type
    const visibleTypes = expandedCommandTypeFilter();
    const typeMatch = visibleTypes.size === 0 || visibleTypes.has(command);

    // Filter by blockchain chain array (from .chains attribute)
    const sourceChains = sourceNode?.chains || [];
    const targetChains = targetNode?.chains || [];

    const chainMatch =
      chainFilter.size === 0 ||
      (sourceChains.some(c => chainFilter.has(c)) &&
       targetChains.some(c => chainFilter.has(c)));


    const fadedStyle = {
        ...data,
        color: isLightTheme() ? "#eee" : "#111",
        size: 0.3,
        opacity: 0.05,
        zIndex: 0
      };

    if (!typeMatch || !chainMatch) return fadedStyle;

    if (focusNode) {
      const neighbors = new Set(graph.neighbors(focusNode));

      const isFocusEdge =
        (source === focusNode && neighbors.has(target)) ||
        (target === focusNode && neighbors.has(source));

        return {
          ...data,
        color: isFocusEdge ? baseColor : (isLightTheme() ? "#eee" : "#111"),
        size: isFocusEdge ? 1.5 : 0.4,
        opacity: isFocusEdge ? 0.6 : 0.1,
        zIndex: isFocusEdge ? 2 : 0
        };
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

function setupSearch_old() {
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

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("clear-search");
  const panel = document.getElementById("side-panel");

  searchInput.addEventListener("input", e => {
    const query = e.target.value;
    clearBtn.style.display = query ? "block" : "none";
    handleSearch(query); // nouvelle fonction puissante
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
    handleSearch(""); // reset filtre
  });
}

function handleSearch(query) {
  const trimmed = query.trim();

  if (!trimmed) {
    graph.forEachNode(n => {
      graph.setNodeAttribute(n, "hidden", false);
    });
    graph.forEachEdge(e => {
      graph.setEdgeAttribute(e, "hidden", false);
    });

    renderer.setSetting("nodeReducer", (node, attr) => ({
      ...attr,
      color: attr.originalColor || attr.color,
      zIndex: 1
    }));

    setupReducers();

    renderer.refresh();
    return;
  }

  let lowerQuery = trimmed.toLowerCase();
  const directlyMatchedNodes = new Set(); // ✅ Strictly matched
  const visibleNodes = new Set();         // ✅ For visibility
  const visibleEdges = new Set();

  // ✅ Step 1: find direct matches from edges
  let matchMode = "both"; // default legacy mode

  if (lowerQuery.startsWith("-")) {
    matchMode = "sender";
    lowerQuery = lowerQuery.slice(1);
  } else if (lowerQuery.startsWith("+")) {
    matchMode = "receiver";
    lowerQuery = lowerQuery.slice(1);
  }
  graph.forEachEdge((edge, attr) => {
      const source = graph.source(edge);
      const target = graph.target(edge);

    let senderMatched = false;
    let receiverMatched = false;

    const senderFields = [attr.sender_key, attr.sender_name]
      .map(v => (v || "").toLowerCase());

    const receiverFields = [attr.receiver_key, attr.receiver_name]
      .map(v => (v || "").toLowerCase());

    if (matchMode === "sender" || matchMode === "both") {
      senderMatched = senderFields.some(f => f.includes(lowerQuery));
    }

    if (matchMode === "receiver" || matchMode === "both") {
      receiverMatched = receiverFields.some(f => f.includes(lowerQuery));
    }

    if (senderMatched || receiverMatched) {
      if (senderMatched) directlyMatchedNodes.add(source);
      if (receiverMatched) directlyMatchedNodes.add(target);

      visibleEdges.add(edge);
      visibleNodes.add(source);
      visibleNodes.add(target);
      }
    });

  // ✅ Step 2: expand visibility to 1-hop neighbors
  directlyMatchedNodes.forEach(node => {
    graph.forEachNeighbor(node, neighbor => {
      visibleNodes.add(neighbor);
      graph.edges(node, neighbor).forEach(e => visibleEdges.add(e));
    });
  });

  // ✅ Step 3: update visibility attributes
  graph.forEachNode(n => {
    graph.setNodeAttribute(n, "hidden", !visibleNodes.has(n));
  });

  graph.forEachEdge(e => {
    graph.setEdgeAttribute(e, "hidden", !visibleEdges.has(e));
  });

  // ✅ Step 4: highlight only strictly matched nodes
  renderer.setSetting("nodeReducer", (node, attr) => {
    if (graph.getNodeAttribute(node, "hidden")) return attr;

    if (directlyMatchedNodes.has(node)) {
      return {
        ...attr,
        color: "#ffff00",
        zIndex: 10,
        size: (attr.size || 6) * 1.6, // bigger node
        highlighted: true        // optional flag if needed later
      };
    }

    return {
      ...attr,
      color: attr.originalColor || attr.color,
      zIndex: 1,
      size: attr.size || 6
    };
  });

  renderer.refresh();
}




async function main(depth = 2, wipeGraph = true, chainOverride = null) {
  const panel = document.getElementById("side-panel");
  
  showLoader(); // ✅ show modal

  totalSteps = 1;
  currentStep = 0;
  //visitedKeys.clear();

  // Rebuild the graph object BEFORE rendering
  if (wipeGraph || !graph) {
    graph = new Graph({ multi: true });
    window.initialPublicKey = "";
  }
  visitedKeysByChain.clear();
  
  await buildGraphRecursively(BASE_KEY, depth, 0, chainOverride);

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
    nodes: graph.nodes().map(n => {
      const attrs = graph.getNodeAttributes(n);

      // Convert Set to Array for export
      const exportedChains = Array.isArray(attrs.chains) ? attrs.chains : [attrs.chains];

      return {
        id: n,
        ...attrs,
        chains: exportedChains
      };
    }),
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

      data.nodes.forEach(n => {
        if (typeof n.chains === "string") {
          n.chains = [n.chains];
        }
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
    fa: [
      "layout-iterations",
      "layout-width",
      "layout-height",
      "layout-gravity",
      "layout-scale",
      "layout-linlog",
      "layout-outbound",
      "layout-strong-gravity",
      "layout-prevent-overlap"
    ],
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
  const chain = blockchain?.toLowerCase?.();
  const explorerMap = {
    mina: {
      block: (val) => `https://minascan.io/mainnet/block/${val}/txs`,
      transaction: (val) => `https://minascan.io/mainnet/tx/${val}/txInfo`,
      account: (val) => `https://minascan.io/mainnet/account/${val}`,
    },
    ethereum: {
      block: (val) => `https://etherscan.io/block/${val}`,
      transaction: (val) => `https://etherscan.io/tx/${val}`,
      account: (val) => `https://etherscan.io/address/${val}`,
    },
    polygon: {
      block: (val) => `https://polygonscan.com/block/${val}`,
      transaction: (val) => `https://polygonscan.com/tx/${val}`,
      account: (val) => `https://polygonscan.com/address/${val}`,
    },
    bsc: {
      block: (val) => `https://bscscan.com/block/${val}`,
      transaction: (val) => `https://bscscan.com/tx/${val}`,
      account: (val) => `https://bscscan.com/address/${val}`,
    },    
    solana: {
      block: (val) => `https://solscan.io/block/${val}`,
      transaction: (val) => `https://solscan.io/tx/${val}`,
      account: (val) => `https://solscan.io/account/${val}`,
    },
    zksync: {
      block: (val) => `https://explorer.zksync.io/block/${val}`,
      transaction: (val) => `https://explorer.zksync.io/tx/${val}`,
      account: (val) => `https://explorer.zksync.io/address/${val}`,
    },
    optimism: {
      block: (val) => `https://optimistic.etherscan.io/block/${val}`,
      transaction: (val) => `https://optimistic.etherscan.io/tx/${val}`,
      account: (val) => `https://optimistic.etherscan.io/address/${val}`,
    },
    arbitrum: {
      block: (val) => `https://arbiscan.io/block/${val}`,
      transaction: (val) => `https://arbiscan.io/tx/${val}`,
      account: (val) => `https://arbiscan.io/address/${val}`,
    },
    cronos: {
      block: (val) => `https://cronoscan.com/block/${val}`,
      transaction: (val) => `https://cronoscan.com/tx/${val}`,
      account: (val) => `https://cronoscan.com/address/${val}`,
    },
    tezos: {
      block: (val) => `https://tzkt.io/${val}`,
      transaction: (val) => `https://tzkt.io/${val}`,
      account: (val) => `https://tzkt.io/${val}`,
    },
    starknet: {
      block: (val) => `https://voyager.online/block/${val}`,
      transaction: (val) => `https://voyager.online/tx/${val}`,
      account: (val) => `https://voyager.online/contract/${val}`,
    },
    base: {
      block: (val) => `https://basescan.org/block/${val}`,
      transaction: (val) => `https://basescan.org/tx/${val}`,
      account: (val) => `https://basescan.org/address/${val}`,
    },    
  };

  const explorer = explorerMap[chain]?.[type];
  return typeof explorer === "function" ? explorer(value) : "#";
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
      sender_name: attrs.sender_name || null,
      receiver_name: attrs.receiver_name || null,
      command_type: attrs.label,
      status: attrs.status,
      timestamp: attrs.timestamp,
      hash: attrs.hash,
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
      token_decimals: attrs.token_decimals,
      contract_call_entrypoint: attrs.contract_call_entrypoint || null, // Valeur par défaut si non défini
    };

    if (!transactionsByNeighbor[source]) transactionsByNeighbor[source] = [];
    if (!transactionsByNeighbor[target]) transactionsByNeighbor[target] = [];

    transactionsByNeighbor[source].push(tx);
    transactionsByNeighbor[target].push(tx);
  });
}

document.addEventListener("keydown", function (event) {
  const tag = document.activeElement.tagName.toLowerCase();
  const input = document.getElementById("search-input");
  const searchDiv = document.getElementById("searchdiv");
  const clearBtn = document.getElementById("clear-search");

  // ESC clears search only if focused
  if (event.key === "Escape" && document.activeElement === input) {
    input.value = "";
    selectedNode = null;
    clearBtn.style.display = "none";
    searchDiv.style.display = "none";
    handleSearch("");
    renderer.refresh();
    return;
  }

  // Ignore all other keys if typing in a field
  if ((tag === "input" || tag === "textarea")) return;

  // Layout (L)
  if (event.key === "l" || event.key === "L") {
    const layoutBtn = document.getElementById("layout-toggle-btn");
    if (layoutBtn) layoutBtn.click();
  }
  
  // Sidebar toggle (S)
  if (event.key === "s" || event.key === "S") {
    const menuBtn = document.getElementById("menu-toggle");
    if (menuBtn) menuBtn.click();
  }  
  
  // Fullscreen toggle (F)
  if (event.key === "f" || event.key === "F") {
    const fullscreenBtn = document.getElementById("fullscreen-toggle");
    if (fullscreenBtn) fullscreenBtn.click();
  }  
  
  // Delete selected node (Del, Backspace, D)
  if (
    selectedNode &&
    (event.key === "Delete" || event.key === "Backspace" || event.key === "d" || event.key === "D")
  ) {
    deleteSelectedNode(selectedNode);
  }

  // Focus search ("/")
  if (event.key === "/") {
    event.preventDefault(); // avoid triggering default quick-find
    searchDiv.style.display = "block";
    input.style.display = "block";
    input.focus();
  }
});

async function isWatched(address, chain) {
  const userId = getOrCreateUserId();
  try {
    const res = await fetch(`https://akirion.com:4665/api/iswatched?userId=${userId}&address=${encodeURIComponent(address)}&chain=${chain}`, {
      headers: { 'x-api-key': '0e74cb18-74fa-458e-8adb-f3a8096c0678' }
    });
    const json = await res.json();
    return json.isWatched;
  } catch (err) {
    console.error('Failed to check watch status:', err);
    return false;
  }
}

function getApiEndpoint(chain, watch = true) {
  const API_URL = "https://akirion.com:4665";

  if (chain === "mina") {
    return `${API_URL}/api/${watch ? "watch-mina" : "unwatch-mina"}`;
  }

  if (chain === "tezos") {
    return `${API_URL}/api/${watch ? "watch-tezos" : "unwatch-tezos"}`;
  }

  // Default to EVM chains (Ethereum, Polygon, BSC, etc.)
  return `${API_URL}/api/${watch ? "watch-alchemy" : "unwatch-alchemy"}`;
}

async function watchThisAddress(address, chain) {
  const API_KEY = "0e74cb18-74fa-458e-8adb-f3a8096c0678";
  const userId = getOrCreateUserId();
  const endpoint = getApiEndpoint(chain, true);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({ userId, address, chain })
  });

  const result = await res.json();
  //alert(`✅ Watch registered: ${result.status}`);
}

async function unwatchThisAddress(address, chain, refreshModal = false) {
  const API_KEY = "0e74cb18-74fa-458e-8adb-f3a8096c0678";
  const endpoint = getApiEndpoint(chain, false);
  const userId = getOrCreateUserId();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ userId, address, chain })
  }).then(() => {
    if (refreshModal) showWatchedAddressesModal();
    //alert(`✅ Unwatched: ${address} (${chain})`);
  });
}


async function unWatchThisAddress_old(address, chain) {
  const API_KEY = "0e74cb18-74fa-458e-8adb-f3a8096c0678";
  const userId = getOrCreateUserId();

  const res = await fetch("https://akirion.com:4665/api/unwatch-alchemy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({ userId, address, chain })
  });

  const result = await res.json();
  alert(`✅ Watch unregistered: ${result.status}`);
}

function renderWatchIcon(container, isWatched, address, chain) {
  if (isWatched) {
    container.innerHTML = `<span onclick="toggleWatch(false, '${address}', '${chain}')" title="Unwatch address" style="cursor:pointer; font-size:18px;">🔔</span>`;
  } else {
    container.innerHTML = `<span onclick="toggleWatch(true, '${address}', '${chain}')" title="Watch address" style="cursor:pointer; font-size:18px;">🔕</span>`;
  }
}

async function toggleWatch(shouldWatch, address, chain) {
  const userId = getOrCreateUserId();
  const endpoint = getApiEndpoint(chain, shouldWatch);
  const method = shouldWatch ? 'POST' : 'POST'; // both are POST, different endpoints
  const body = JSON.stringify({ userId, address, chain });

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '0e74cb18-74fa-458e-8adb-f3a8096c0678'
      },
      body
    });

    if (res.ok) {
      const watchSpan = document.getElementById("watch-status");
      if (watchSpan) renderWatchIcon(watchSpan, shouldWatch, address, chain);
      const favoriteSpan = document.getElementById("favorite-status");
      if (favoriteSpan) renderFavIcon(favoriteSpan, isFavorite(address, selectedBlockchain), address, selectedBlockchain);
    } else {
      console.warn("Failed to update watch status:", await res.text());
    }
  } catch (err) {
    console.error("Error updating watch status:", err);
  }
}

async function showWatchedAddressesModal() {
  const userId = getOrCreateUserId();
  try {
    const response = await fetch(`https://akirion.com:4665/api/watched?userId=${userId}`, {
      headers: { 'x-api-key': '0e74cb18-74fa-458e-8adb-f3a8096c0678' }
    });
    const data = await response.json();
    const list = document.getElementById('watched-list');
    list.innerHTML = '';
    list.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      </table>
      <div style="max-height: 300px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tbody id="watched-table-body"></tbody>
      </table>
      </div>
    `;

    const tbody = document.getElementById('watched-table-body');
    data.watched.forEach(({ address, chain }) => {
      const shortened = address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-6)}` : address;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding: 6px;font-size: 10px;"><code>${shortened}</code></td>
        <td style="padding: 6px;"><small style="color:#aaa">${chain}</small></td>
        <td style="padding: 6px; text-align: center;">
          <button onclick="unwatchThisAddress('${address}', '${chain}', true)" style="
            padding: 4px 10px;
            font-size: 10px;
            background: #e53935;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Unwatch</button>
        </td>
      `;

      tbody.appendChild(row);
    });
    document.getElementById('watched-modal').style.display = 'block';
  } catch (err) {
    alert('Error fetching watched addresses');
    console.error(err);
  }
}

function getOrCreateUserId() {
  let id = localStorage.getItem("mge_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("mge_user_id", id);
  }
  return id;
}

// UNUSED
function showInAppNotification(title, body) {
  const notif = document.createElement('div');
  notif.style.position = 'fixed';
  notif.style.bottom = '20px';
  notif.style.right = '20px';
  notif.style.background = '#333';
  notif.style.color = 'white';
  notif.style.padding = '12px 18px';
  notif.style.borderRadius = '8px';
  notif.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
  notif.style.zIndex = 9999;
  notif.style.fontSize = '14px';
  notif.style.maxWidth = '300px';
  notif.style.cursor = 'pointer';
  notif.style.transition = 'opacity 0.3s';

  notif.innerHTML = `<strong>${title}</strong><br>${body}`;

  notif.onclick = () => notif.remove();

  document.body.appendChild(notif);

  // Auto-remove after 5 seconds
  setTimeout(() => notif.remove(), 10000);
}

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function isAddressInFavorites(address, chain) {
  return getFavorites().some(fav => fav.address === address && fav.chain === chain);
}

function isFavorite(address, chain) {
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  return favorites.some(entry => entry.address === address && entry.chain === chain);
}

function unFavThisAddress(address, chain) {
  let favorites = getFavorites();
  favorites = favorites.filter(fav => !(fav.address === address && fav.chain === chain));
  saveFavorites(favorites);
}

function renderFavIcon(container, isFav, address, chain) {
  container.innerHTML = `<span onclick="toggleFavorite(${!isFav}, '${address}', '${chain}')" 
    title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" 
    style="cursor:pointer; font-size:18px;">${isFav ? "⭐" : "☆"}</span>`;
}

function toggleFavorite(shouldAdd, address, chain) {
  const favorites = getFavorites();
  const index = favorites.findIndex(entry => entry.address === address && entry.chain === chain);

  if (shouldAdd && index === -1) {
    favorites.push({ address, chain, label: "" });
  } else if (!shouldAdd && index !== -1) {
    favorites.splice(index, 1);
  }

  saveFavorites(favorites);

  const favSpan = document.getElementById("favorite-status");
  if (favSpan) renderFavIcon(favSpan, shouldAdd, address, chain);
}

function toggleSort(key) {
  if (currentSortKey === key) {
    currentSortAsc = !currentSortAsc;
  } else {
    currentSortKey = key;
    currentSortAsc = true;
  }

  favorites.sort((a, b) => {
    const v1 = (a[currentSortKey] || "").toLowerCase();
    const v2 = (b[currentSortKey] || "").toLowerCase();
    return currentSortAsc ? v1.localeCompare(v2) : v2.localeCompare(v1);
  });

  renderFavoritesTable(favorites);

  // Update sort indicators
  modal.querySelectorAll("th[data-sort-key]").forEach(th => {
    const icon = th.querySelector(".sort-indicator");
    if (th.dataset.sortKey === currentSortKey) {
      icon.textContent = currentSortAsc ? "▲" : "▼";
    } else {
      icon.textContent = "↕";
    }
  });
}

function copyAddressToClipboard(el, address) {
  navigator.clipboard.writeText(address).then(() => {
    const toast = document.createElement("div");
    toast.textContent = "✅ Copied!";
    toast.style.cssText = `
      position: absolute;
      top: -18px;
      left: 0;
      background: #222;
      color: #fff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;
    el.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 1000);
  });
}

function showFavoritesAddressesModal() {
  let currentSortKey = null;
  let currentSortAsc = true;

  // Supprime tout modal existant pour repartir propre
  const existing = document.getElementById("favorites-overlay");
  if (existing) existing.remove();

  // Fonction de tri appelée depuis les en-têtes
  function toggleSort(key) {
    if (currentSortKey === key) {
      currentSortAsc = !currentSortAsc;
    } else {
      currentSortKey = key;
      currentSortAsc = true;
    }
    renderFavoritesTable(getFilteredFavorites());
    updateSortIndicators();
  }

  const modal = createFavoritesModal(toggleSort);
  modal.style.display = "flex";

  const favorites = getFavorites();
  const tableBody = modal.querySelector("#favorites-table-body");
  const searchInputs = modal.querySelectorAll(".fav-search");

  if (!tableBody) {
    console.error("❌ #favorites-table-body introuvable dans le modal.");
    console.log("Contenu du modal:", modal.outerHTML);
    return;
  }

  searchInputs.forEach(input => {
    input.addEventListener("input", () => {
      renderFavoritesTable(getFilteredFavorites());
    });
  });

  function getFilteredFavorites() {
    const [addrFilter, chainFilter, labelFilter] = Array.from(searchInputs).map(i => i.value.toLowerCase());
    let filtered = favorites.filter(f =>
      f.address.toLowerCase().includes(addrFilter) &&
      f.chain.toLowerCase().includes(chainFilter) &&
      (f.label || "").toLowerCase().includes(labelFilter)
    );

    if (currentSortKey) {
      filtered.sort((a, b) => {
        const valA = (a[currentSortKey] || "").toLowerCase();
        const valB = (b[currentSortKey] || "").toLowerCase();
        return currentSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    return filtered;
  }

  function updateSortIndicators() {
    const indicators = modal.querySelectorAll(".sort-indicator");
    indicators.forEach(indicator => {
      const sortKey = indicator.closest("th")?.querySelector("input")?.dataset.sortKey;
      if (!sortKey) return;

      if (sortKey === currentSortKey) {
        indicator.textContent = currentSortAsc ? "▲" : "▼";
      } else {
        indicator.textContent = "↕";
      }
    });
  }

  function renderFavoritesTable(favs) {
    tableBody.innerHTML = "";
    favs.forEach(({ address, chain, label }) => {
    const shortened = address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-6)}` : address;
      const explorerURL = getExplorerURL("account", address, chain);
    const row = document.createElement("tr");

    row.innerHTML = `
        <td style="white-space: nowrap;">
          <code title="${address}" style="cursor: pointer; position: relative;" onclick="copyAddressToClipboard(this, '${address}')">
            ${shortened}
          </code>
        </td>     
        <td style="white-space: nowrap;">${chain}</td>
        <td style="width: 100%;">
          <input class="fav-label" value="${label || ""}" onchange="updateFavoriteLabel('${address}', '${chain}', this.value)"
                 style="width: 100%; box-sizing: border-box;" />
        </td>
        <td style="white-space: nowrap; text-align: right; width:1%;">
          <a class="fav-link" href="${explorerURL}" target="_blank" title="Voir dans explorer">🔗</a>
          <button class="fav-btn" title="QR Code" onclick="showQRCode('${address}')">📱</button>
          <button class="fav-btn" title="Fetch" onclick="fetchFavorite('${address}', '${chain}'); document.getElementById('favorites-overlay')?.remove();">🔍</button>
          <button class="fav-btn" title="Supprimer" onclick="unFavThisAddress('${address}', '${chain}'); showFavoritesAddressesModal()">❌</button>
      </td>
    `;
      tableBody.appendChild(row);
    });
    // 🔁 Refresh sort icons after render
    updateSortIndicators();
  }

  // Initial render
  renderFavoritesTable(getFilteredFavorites());
}


function createFavoritesModal(toggleSortCallback) {
  const modal = document.createElement("div");
  modal.id = "favorites-overlay";
  modal.style.display = "flex";

  const closeButton = document.createElement("button");
  closeButton.textContent = "CLOSE";
  closeButton.className = "close-fav";
  closeButton.onclick = () => modal.remove();

  const title = document.createElement("h2");
  title.textContent = "⭐ Favorites";
  title.style.fontSize = "20px";
  title.style.marginBottom = "16px";

  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "favorites-scroll-wrapper";

  const table = document.createElement("table");
  table.className = "favorites-table"; // 📌 Add this for CSS
  table.style.cssText = `
    width: 100%;
    min-width: 400px;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 12px;
  `;

  const thead = document.createElement("thead");
  const tr = document.createElement("tr");

  const sortKeys = ["address", "chain", "label"];
  ["Adresse", "Blockchain", "Label"].forEach((placeholder, index) => {
    const sortKey = sortKeys[index];

    const th = document.createElement("th");
    th.style.position = "relative";

    const inputWrapper = document.createElement("div");
    inputWrapper.style.position = "relative";
    inputWrapper.style.width = "100%";

    const input = document.createElement("input");
    input.className = "fav-search";
    input.placeholder = placeholder;
    input.dataset.sortKey = sortKey;
    input.style.cssText = `
      padding: 6px 22px 6px 6px;
      width: 100%;
      border-radius: 4px;
      border: 1px solid #444;
      background: #1a1a1a;
      color: #f0f0f0;
      font-size: 13px;
    `;

    const icon = document.createElement("span");
    icon.className = "sort-indicator";
    icon.textContent = "↕";
    icon.style.cssText = `
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      color: #aaa;
      cursor: pointer;
      user-select: none;
    `;

    icon.onclick = (e) => {
      e.stopPropagation();
      if (typeof toggleSortCallback === "function") {
        toggleSortCallback(sortKey);
      }
    };

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(icon);
    th.appendChild(inputWrapper);

    tr.appendChild(th);
  });

  const thActions = document.createElement("th");
  thActions.textContent = "";
  tr.appendChild(thActions);

  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tbody.id = "favorites-table-body";
  table.appendChild(tbody);

  scrollWrapper.appendChild(table);
  modal.appendChild(closeButton);
  modal.appendChild(title);
  modal.appendChild(scrollWrapper);

  document.body.appendChild(modal);
  return modal;
}




function updateFavoriteLabel(address, chain, newLabel) {
  const favorites = getFavorites();
  const idx = favorites.findIndex(f => f.address === address && f.chain === chain);
  if (idx !== -1) {
    favorites[idx].label = newLabel;
    saveFavorites(favorites);
  }
}


function fetchFavorite(address, chain) {
  const select = document.getElementById("blockchain-select");
  select.value = chain;

  // ⏬ Manually dispatch change event
  select.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById("param-base-key").value = address;
  document.getElementById("start-graph-btn").click();
  document.getElementById("favorites-modal").style.display = "none";
}

function showQRCode(address) {
  const modal = document.getElementById("qrcode-modal");
  const container = document.getElementById("qrcode-container");
  container.innerHTML = ''; // Clear previous QR code

  // Créer un conteneur centré
  const innerWrapper = document.createElement("div");
  innerWrapper.style.display = "flex";
  innerWrapper.style.flexDirection = "column";
  innerWrapper.style.alignItems = "center";
  innerWrapper.style.justifyContent = "center";

  // Générer le QR Code
  const qrDiv = document.createElement("div");
  new QRCode(qrDiv, {
    text: address,
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.M
  });
  innerWrapper.appendChild(qrDiv);

  // Ajouter l'adresse en dessous
  const label = document.createElement("p");
  label.style.marginTop = "10px";
  label.style.fontSize = "12px";
  label.style.wordBreak = "break-all";
  label.style.color = "#000";
  label.style.textAlign = "center";
  label.textContent = address;
  innerWrapper.appendChild(label);

  container.appendChild(innerWrapper);
  modal.style.display = "flex";
}

// ✅ Ensure DB version is 2 and uses message_id as key
function openNotificationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('notificationDB', 2);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (db.objectStoreNames.contains('notifications')) {
        db.deleteObjectStore('notifications');
      }
      db.createObjectStore('notifications', { keyPath: 'message_id' });
    };

    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

// --- Load all notifications
function getSavedNotifications() {
  return openNotificationDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readonly');
      const store = tx.objectStore('notifications');
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = reject;
    });
  });
}

// --- Save notification
function saveNotificationToStorage(data) {
  return openNotificationDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');

      const timestamp = Date.now();
      const newEntry = { ...data, timestamp };

      if (!newEntry.message_id) {
        console.warn('[UI] Cannot save notification: missing message_id');
        resolve();
        return;
      }

      const getRequest = store.get(newEntry.message_id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;

        if (existing) {
          const hasAllFields =
            existing.click_action &&
            existing.chain &&
            (existing.sender || existing.receiver || existing.address) &&
            existing.action_primary;

          if (hasAllFields) {
            console.log('[UI] Duplicate message_id with complete data, skipping:', newEntry.message_id);
          resolve();
            return;
        } else {
            // Overwrite with more complete data
            console.log('[UI] Overwriting incomplete notification:', newEntry.message_id);
            store.put(newEntry);
          }
        } else {
          console.log('[UI] Saving new notification:', newEntry.message_id);
          store.add(newEntry);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = (err) => {
          console.error('[UI] IndexedDB transaction error:', err);
          reject(err);
        };
      };

      getRequest.onerror = reject;
    });
  });
}


// --- Update badge
async function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;

  try {
    const notifs = await getSavedNotifications();
    badge.textContent = notifs.length;
    badge.style.display = notifs.length > 0 ? 'inline-block' : 'none';
  } catch (err) {
    console.error('Badge update error:', err);
  }
}

function deleteNotification(message_id) {
  return openNotificationDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');
      store.delete(message_id);
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  });
}

async function showNotificationList() {
  const container = document.getElementById('notification-list');
  const notifs = await getSavedNotifications();

  if (!notifs.length) {
    container.innerHTML = "<p style='margin:0;color:#888;'>No notifications</p>";
  } else {
    container.innerHTML = notifs
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(n => {
        let graphButtons = '';

        if (n.action_primary === 'show_graph' && n.chain) {
          if (n.sender) {
            graphButtons += `<button onclick="handleShowGraph('${n.chain}', '${n.sender}')" style="
              margin-top: 6px;
              margin-right: 6px;
              padding: 4px 8px;
              background: #2c88ff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">Sender Graph</button>`;
          }
          if (n.receiver) {
            graphButtons += `<button onclick="handleShowGraph('${n.chain}', '${n.receiver}')" style="
              margin-top: 6px;
              margin-right: 6px;
              padding: 4px 8px;
              background: #27a745;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">Receiver Graph</button>`;
          }
          if (!n.sender && !n.receiver && n.address) {
            graphButtons += `<button onclick="handleShowGraph('${n.chain}', '${n.address}')" style="
              margin-top: 6px;
              margin-right: 6px;
              padding: 4px 8px;
              background: #2c88ff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">Show Graph</button>`;
          }
        }

        const dismissBtn = `<button onclick="deleteAndRefresh('${n.message_id}')" style="
            margin-top: 6px;
            padding: 4px 8px;
            background: #444;
            color: #ccc;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">Dismiss</button>`;

        return `
        <div class="notif-item" data-id="${n.message_id}" style="padding: 6px 4px; border-bottom: 1px solid #444; position: relative;">
          <strong>${n.title}</strong><br>
            <small>${(n.body || '').replace(/\n/g, '<br/>')}</small><br/>
          <small style="color: #aaa;">${new Date(n.timestamp).toLocaleString()}</small>
          <button style="
            position: absolute;
            top: 4px;
            right: 4px;
            background: transparent;
            color: #aaa;
            border: none;
            cursor: pointer;
            font-size: 14px;
          " title="Delete" onclick="deleteAndRefresh('${n.message_id}')">✖</button>
            <div style="margin-top: 6px;">${graphButtons}${dismissBtn}</div>
        </div>
        `;
      }).join('');

      // ✅ Enable swipe-to-delete
      container.querySelectorAll('.notif-item').forEach(el => {
        let startX = null;

      // Mobile
      el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
        el.addEventListener('touchmove', e => {
          if (startX === null) return;
          const deltaX = e.touches[0].clientX - startX;
          el.style.transform = `translateX(${Math.min(deltaX, 100)}px)`;
          el.style.opacity = `${1 - Math.min(deltaX / 100, 1)}`;
        });

        el.addEventListener('touchend', async () => {
          const deltaX = parseFloat(el.style.transform.replace(/[^0-9.-]/g, '') || 0);
          if (deltaX > 50) {
            const id = el.dataset.id;
            await deleteAndRefresh(id);
          } else {
            el.style.transform = '';
            el.style.opacity = '';
          }
          startX = null;
        });

        // --- Desktop: mouse
        let mouseStartX = null;

        el.addEventListener('mousedown', e => {
          mouseStartX = e.clientX;
          el.style.transition = 'none';
        });

        el.addEventListener('mousemove', e => {
          if (mouseStartX === null) return;
          const deltaX = e.clientX - mouseStartX;
          el.style.transform = `translateX(${Math.min(deltaX, 100)}px)`;
          el.style.opacity = `${1 - Math.min(deltaX / 100, 1)}`;
        });

        el.addEventListener('mouseup', async e => {
          const deltaX = e.clientX - mouseStartX;
          el.style.transition = 'transform 0.2s ease, opacity 0.2s ease';

          if (deltaX > 50) {
            const id = el.dataset.id;
            await deleteAndRefresh(id);
          } else {
            el.style.transform = '';
            el.style.opacity = '';
          }
          mouseStartX = null;
        });

        el.addEventListener('mouseleave', () => {
          mouseStartX = null;
          el.style.transform = '';
          el.style.opacity = '';
        });
      });
  }

  container.style.display = 'block';
}

// Global graph launcher
window.handleShowGraph = function(chain, address) {
  if (!chain || !address) return;
  console.log('[UI] Triggering graph display from notification list:', chain, address);
  LIMIT = parseInt(document.getElementById("param-limit").value, 10);
  FIRST_ITERATION_LIMIT = parseInt(document.getElementById("param-first-iteration").value, 10);  
  BASE_KEY = address;
  main(1, true, chain);
};


// Then attach it globally
window.deleteAndRefresh = async function(message_id) {
  await deleteNotification(message_id);
  await updateNotificationBadge();
  await showNotificationList();
};

function showToastNotification(title, body) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const safeBody = (body || '').replace(/\n/g, '<br/>');

  toast.innerHTML = `<strong>${title}</strong><br>${safeBody}`;
  toast.style.display = 'block';

  if (window._toastTimeout) {
    clearTimeout(window._toastTimeout);
  }

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.style.display = 'none';
  }, 4000);
}

import SignClient from "@walletconnect/sign-client";
import EthereumProvider from "@walletconnect/ethereum-provider";

const PROJECT_ID = "e7c987c4886cb9b77abbda154818712e";
const MINA_CHAIN = "mina:mainnet";
const MINA_CHAINS = ["mina:mainnet", "mina:devnet", "zeko:testnet"];
const MINA_METHODS = ["mina_sendPayment", "mina_sendTransaction", "wallet_info"];
const EVM_RPC = {
  1: "https://ethereum-rpc.publicnode.com",
  56: "https://bsc-dataseed.bnbchain.org",
  137: "https://polygon-bor-rpc.publicnode.com"
};
const installedEvmProviders = new Map();
let minaClientPromise = null;
let minaSession = null;
let minaSessionRestored = false;
const evmProviderPromises = new Map();
let pendingPrompt = null;

const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
const sleep = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));

const metadata = () => ({
  name: "Mina Graph Explorer",
  description: "Explore blockchain transaction graphs and send optional donations",
  url: window.location.origin,
  icons: [`${window.location.origin}/icons/icon-192.png`]
});

function elements() {
  return {
    modal: document.getElementById("wallet-connect-modal"),
    title: document.getElementById("wallet-connect-title"),
    message: document.getElementById("wallet-connect-message"),
    wallets: document.getElementById("wallet-connect-wallets"),
    links: document.getElementById("wallet-connect-links"),
    copy: document.getElementById("wallet-connect-copy"),
    qrToggle: document.getElementById("wallet-connect-qr-toggle"),
    qrBox: document.getElementById("wallet-connect-qr-box"),
    qr: document.getElementById("wallet-connect-qr"),
    uri: document.getElementById("wallet-connect-uri"),
    cancel: document.getElementById("wallet-connect-cancel")
  };
}

function closePrompt() {
  const ui = elements();
  if (ui.modal) ui.modal.hidden = true;
  if (ui.qrBox) ui.qrBox.hidden = true;
  if (ui.qr) ui.qr.innerHTML = "";
  if (ui.wallets) ui.wallets.innerHTML = "";
  if (ui.links) ui.links.innerHTML = "";
  if (ui.copy) {
    ui.copy.hidden = true;
    ui.copy.textContent = "Copy WalletConnect URI";
  }
  if (ui.qrToggle) {
    ui.qrToggle.hidden = true;
    ui.qrToggle.textContent = "Show connection QR code";
  }
  if (ui.cancel) ui.cancel.hidden = false;
  pendingPrompt = null;
}

function cancelPrompt() {
  const prompt = pendingPrompt;
  closePrompt();
  prompt?.reject?.(new Error("Wallet connection cancelled."));
}

function renderQr(uri) {
  const ui = elements();
  if (!ui.qr || !window.QRCode) return;
  ui.qr.innerHTML = "";
  new window.QRCode(ui.qr, { text: uri, width: 240, height: 240, correctLevel: window.QRCode.CorrectLevel.M });
}

function walletLinks(kind, uri) {
  if (kind === "mina" && isMobileDevice()) {
    return [{ label: "Open Auro", href: `aurowallet://wc?uri=${encodeURIComponent(uri)}` }];
  }
  if (kind === "mina") return [];
  return [
    { label: "Open MetaMask", href: `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}` },
    { label: "Open Trust Wallet", href: `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}` }
  ];
}

function showWalletRequestPrompt(kind) {
  const ui = elements();
  ui.modal.hidden = false;
  ui.title.textContent = "Approve transaction";
  ui.message.textContent = "Approve and sign the transaction in your wallet, then return to Minagraph.";
  ui.wallets.innerHTML = "";
  ui.links.innerHTML = kind === "mina" && isMobileDevice()
    ? '<a class="wallet-connect-primary" href="aurowallet://" rel="noreferrer">Open Auro</a>'
    : "";
  ui.copy.hidden = true;
  ui.qrToggle.hidden = true;
  ui.qrBox.hidden = true;
  ui.cancel.hidden = false;
  ui.cancel.onclick = cancelPrompt;
}

function showConnectionPrompt({ kind, uri, message }) {
  const ui = elements();
  if (!ui.modal) throw new Error("WalletConnect dialog is unavailable.");
  ui.modal.hidden = false;
  ui.title.textContent = "WalletConnect";
  ui.message.textContent = message || "Approve the connection in your wallet, then return to Minagraph.";
  ui.wallets.innerHTML = "";
  ui.links.innerHTML = walletLinks(kind, uri).map(link =>
    `<a class="wallet-connect-primary" href="${link.href}" rel="noreferrer">${link.label}</a>`
  ).join("");
  ui.copy.hidden = false;
  ui.qrToggle.hidden = false;
  ui.qrToggle.textContent = "Hide connection QR code";
  ui.qrBox.hidden = false;
  ui.cancel.hidden = false;
  ui.uri.textContent = uri;
  renderQr(uri);
  ui.copy.onclick = async () => {
    await navigator.clipboard.writeText(uri);
    ui.copy.textContent = "Copied";
    window.setTimeout(() => { ui.copy.textContent = "Copy WalletConnect URI"; }, 1400);
  };
  ui.qrToggle.onclick = () => {
    ui.qrBox.hidden = !ui.qrBox.hidden;
    ui.qrToggle.textContent = ui.qrBox.hidden ? "Show connection QR code" : "Hide connection QR code";
    if (!ui.qrBox.hidden) renderQr(uri);
  };
  ui.cancel.onclick = cancelPrompt;
}

function chooseInstalledEvmProvider(providers) {
  if (providers.length === 1) return Promise.resolve(providers[0].provider);
  const ui = elements();
  ui.modal.hidden = false;
  ui.title.textContent = "Choose a wallet";
  ui.message.textContent = "Select an installed browser wallet or connect another wallet with WalletConnect.";
  ui.links.innerHTML = "";
  ui.copy.hidden = true;
  ui.qrToggle.hidden = true;
  ui.qrBox.hidden = true;
  ui.cancel.hidden = false;
  ui.wallets.innerHTML = "";
  return new Promise((resolve, reject) => {
    pendingPrompt = { reject };
    providers.forEach(item => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wallet-connect-wallet-choice";
      if (item.info?.icon) {
        const icon = document.createElement("img");
        icon.src = item.info.icon;
        icon.alt = "";
        button.appendChild(icon);
      }
      const label = document.createElement("span");
      label.textContent = item.info?.name || "Browser wallet";
      button.appendChild(label);
      button.onclick = () => { closePrompt(); resolve(item.provider); };
      ui.wallets.appendChild(button);
    });
    const walletConnectButton = document.createElement("button");
    walletConnectButton.type = "button";
    walletConnectButton.className = "wallet-connect-wallet-choice";
    walletConnectButton.textContent = "WalletConnect / QR code";
    walletConnectButton.onclick = () => { closePrompt(); resolve(null); };
    ui.wallets.appendChild(walletConnectButton);
    ui.cancel.onclick = cancelPrompt;
  });
}

function registerEip6963() {
  window.addEventListener("eip6963:announceProvider", event => {
    const detail = event.detail;
    if (!detail?.provider) return;
    installedEvmProviders.set(detail.info?.uuid || detail.info?.rdns || detail.info?.name || String(installedEvmProviders.size), detail);
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

function availableEvmProviders() {
  const providers = [...installedEvmProviders.values()];
  if (window.ethereum && !providers.some(item => item.provider === window.ethereum)) {
    providers.push({
      info: { name: window.ethereum.isMetaMask ? "MetaMask" : window.ethereum.isTrust ? "Trust Wallet" : "Browser wallet" },
      provider: window.ethereum
    });
  }
  return providers;
}

async function evmWalletConnectProvider(chainId) {
  if (evmProviderPromises.has(chainId)) return evmProviderPromises.get(chainId);
  const promise = EthereumProvider.init({
    projectId: PROJECT_ID,
    chains: [chainId],
    methods: ["eth_sendTransaction", "personal_sign"],
    events: ["chainChanged", "accountsChanged"],
    showQrModal: false,
    metadata: metadata(),
    customStoragePrefix: `minagraph-evm-${chainId}`,
    rpcMap: { [chainId]: EVM_RPC[chainId] }
  }).then(async provider => {
    provider.on("display_uri", uri => showConnectionPrompt({ kind: "evm", uri }));
    provider.__minagraphWalletConnect = true;
    if (provider.session) {
      try { await provider.disconnect(); } catch (_error) { /* stale persisted session */ }
    }
    return provider;
  }).catch(error => {
    evmProviderPromises.delete(chainId);
    throw error;
  });
  evmProviderPromises.set(chainId, promise);
  return promise;
}

async function connectEvmWalletConnect(chainId = 1) {
  const provider = await evmWalletConnectProvider(chainId);
  if (provider.session) return provider;
  const connection = provider.connect();
  await Promise.race([
    connection,
    new Promise((_resolve, reject) => { pendingPrompt = { reject }; })
  ]).catch(async error => {
    if (provider.session) {
      try { await provider.disconnect?.(); } catch (_disconnectError) { /* session already closed */ }
    }
    throw error;
  });
  closePrompt();
  const namespace = provider.session?.namespaces?.eip155;
  console.info("[WalletConnect EVM] session approved", {
    chains: namespace?.chains,
    accounts: namespace?.accounts,
    methods: namespace?.methods
  });
  if (!namespace?.methods?.includes("eth_sendTransaction")) {
    try { await provider.disconnect(); } catch (_error) { /* session already closed */ }
    throw new Error("The wallet connected without approving eth_sendTransaction. Reconnect and approve transaction permissions.");
  }
  return provider;
}

async function connectEvmProvider(requestedChainId = 1) {
  const installed = availableEvmProviders();
  let provider = installed.length ? await chooseInstalledEvmProvider(installed) : null;
  if (!provider) return connectEvmWalletConnect(requestedChainId);
  await provider.request({ method: "eth_requestAccounts" });
  return provider;
}

async function minaClient() {
  minaClientPromise ||= SignClient.init({
    projectId: PROJECT_ID,
    metadata: metadata(),
    logger: "warn",
    customStoragePrefix: "minagraph-mina"
  });
  const client = await minaClientPromise;
  if (!client.__minagraphListenersRegistered) {
    client.__minagraphListenersRegistered = true;
    client.on("session_request_sent", event => console.info("[WalletConnect Mina] request sent", event));
    client.on("session_delete", event => {
      if (event?.topic === minaSession?.topic) {
        minaSession = null;
        minaSessionRestored = false;
      }
    });
  }
  if (!minaSession) {
    minaSession = client.session.getAll().find(item => item.namespaces?.mina?.accounts?.length) || null;
    minaSessionRestored = Boolean(minaSession);
  }
  return client;
}

async function disconnectMinaSession(message) {
  const client = await minaClient();
  const session = minaSession;
  minaSession = null;
  minaSessionRestored = false;
  if (!session) return;
  try {
    await client.disconnect({
      topic: session.topic,
      reason: { code: 6000, message: message || "Session reset" }
    });
  } catch (_error) {
    // A stale peer may already be unreachable; the local session is still reset.
  }
}

function minaAccount() {
  const value = minaSession?.namespaces?.mina?.accounts?.find(account => account.startsWith("mina:"));
  if (!value) return null;
  const parts = value.split(":");
  return parts.length >= 3 ? parts.slice(2).join(":") : null;
}

function minaChainId() {
  const value = minaSession?.namespaces?.mina?.accounts?.find(account => account.startsWith("mina:"));
  if (!value) return MINA_CHAIN;
  const parts = value.split(":");
  return parts.length >= 3 ? `${parts[0]}:${parts[1]}` : MINA_CHAIN;
}

function minaSessionSupports(method) {
  const methods = minaSession?.namespaces?.mina?.methods;
  return !method || !Array.isArray(methods) || methods.includes(method);
}

async function connectMinaSession(requiredMethod) {
  const client = await minaClient();
  if (minaSession && minaAccount() && !minaSessionRestored && minaSessionSupports(requiredMethod)) return minaSession;
  if (minaSession && !minaSessionSupports(requiredMethod)) {
    await disconnectMinaSession(`Reconnect for ${requiredMethod}`);
  }
  if (minaSessionRestored) await disconnectMinaSession("Reconnect restored wallet");
  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      mina: { chains: MINA_CHAINS, methods: MINA_METHODS, events: ["accountsChanged", "chainChanged"] }
    }
  });
  if (uri) showConnectionPrompt({ kind: "mina", uri, message: "Approve the request in Auro, then return to Minagraph." });
  minaSession = await Promise.race([
    approval(),
    new Promise((_resolve, reject) => { pendingPrompt = { reject }; })
  ]);
  minaSessionRestored = false;
  closePrompt();
  return minaSession;
}

const minaWalletConnectProvider = {
  async requestAccounts() {
    await connectMinaSession();
    const account = minaAccount();
    if (!account) throw new Error("No Mina account returned by WalletConnect.");
    return [account];
  },
  async sendPayment(args) {
    await connectMinaSession("mina_sendPayment");
    const client = await minaClient();
    const from = minaAccount();
    if (!from) throw new Error("No Mina account returned by WalletConnect.");
    showWalletRequestPrompt("mina");
    const request = client.request({
      topic: minaSession.topic,
      chainId: minaChainId(),
      request: {
        method: "mina_sendPayment",
        params: {
          from,
          to: args.to,
          amount: Number(args.amount),
          // Auro Mobile currently casts this WalletConnect field to String
          // before validating it. Sending a JSON number makes its request
          // listener fail silently before the approval dialog is displayed.
          fee: String(args.fee || "0.01"),
          memo: args.memo || ""
        }
      }
    });
    console.info("[WalletConnect Mina] publishing mina_sendPayment", {
      topic: minaSession.topic,
      chainId: minaChainId(),
      from,
      to: args.to,
      amount: Number(args.amount)
    });
    let timeoutId;
    const cancellation = new Promise((_resolve, reject) => {
      pendingPrompt = { reject };
      timeoutId = window.setTimeout(
        () => reject(new Error("Wallet signature request timed out. Please reconnect the wallet.")),
        120000
      );
    });
    // Let the WalletConnect relay publish the request before switching apps.
    // Without this short delay Auro can reopen before the request reaches it.
    if (isMobileDevice()) {
      await sleep(750);
      window.location.href = "aurowallet://";
    }
    try {
      return await Promise.race([request, cancellation]);
    } catch (error) {
      if (/cancelled|timed out/i.test(error?.message || "")) {
        await disconnectMinaSession(error.message);
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
      closePrompt();
    }
  }
};

async function getMinaProvider(injectedProvider) {
  if (injectedProvider) return injectedProvider;
  await connectMinaSession();
  return minaWalletConnectProvider;
}

registerEip6963();
window.MinagraphWallets = Object.freeze({
  connectEvmProvider,
  getMinaProvider,
  availableEvmProviders
});

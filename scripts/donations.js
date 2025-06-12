const WALLETCONNECT_PROJECT_ID = "e7c987c4886cb9b77abbda154818712e";
const EVM_DONATION_ADDRESS = "0x52356a419879331172c1326909316bb8205071e0";

const ERC20_ADDRESSES = {
    USDT: {
        polygon: "0x3813e82e6f7098b9583FC0F33a962D02018B6803",
        ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        bsc: "0x55d398326f99059fF775485246999027B3197955"
    },
    USDC: {
        polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        bsc: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"
    }
};

const CHAIN_NAMES = {
    1: "ethereum",
    56: "bsc",
    137: "polygon"
};

const CHAIN_INFO = {
    1: { name: "Ethereum", symbol: "ETH" },
    56: { name: "BSC", symbol: "BNB" },
    137: { name: "Polygon", symbol: "MATIC" }
};

let statusTimeout;

function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(hideStatus, 5000); // Masquer après 5s
}

function hideStatus() {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;

    statusDiv.style.display = 'none';
    statusDiv.textContent = '';
    statusDiv.className = 'status';
}

function setButtonState(loading) {
    const btn = document.getElementById('donate-btn-evm');
    btn.disabled = loading;
    btn.textContent = loading ? 'Connecting...' : 'Donate with Crypto Wallet';
}

async function sendEVMDonation() {
    const amount = parseFloat(document.getElementById("donation-amount-evm").value);
    const token = document.getElementById("donation-token").value;
    
    if (!amount || amount <= 0) {
        showStatus("Please enter a valid amount", 'error');
        return;
    }

    hideStatus();
    setButtonState(true);

    let provider;
    let ethersProvider;
    let signer;
    let chainId;
    let chain;

    try {
        // Essayer d'abord les wallets injectés (MetaMask, etc.)
        if (window.ethereum) {
            showStatus("Detected browser wallet, connecting...", 'info');
            provider = window.ethereum;
            await provider.request({ method: "eth_requestAccounts" });
            
        } else {
            // Si pas de wallet injecté, utiliser WalletConnect
            showStatus("No browser wallet detected, opening WalletConnect...", 'info');
            
            if (!window.WalletConnectEthereumProvider) {
                throw new Error("WalletConnect not loaded properly");
            }

            const WalletConnectProvider = window.WalletConnectEthereumProvider.default;
            
            provider = await WalletConnectProvider.init({
                projectId: WALLETCONNECT_PROJECT_ID,
                chains: [1, 56, 137],
                showQrModal: true,
                optionalChains: [1, 56, 137],
                rpcMap: {
                    1: "https://eth.llamarpc.com",
                    56: "https://bsc-dataseed.binance.org",
                    137: "https://polygon-rpc.com"
                },
                metadata: {
                    name: "Crypto Tip Donation",
                    description: "Send crypto tips easily",
                    url: window.location.origin,
                    icons: ["https://walletconnect.com/walletconnect-logo.png"]
                }
            });

            showStatus("Please scan the QR code with your mobile wallet", 'info');
            await provider.connect();
        }

        showStatus("Wallet connected! Preparing transaction...", 'info');
        
        ethersProvider = new ethers.BrowserProvider(provider);
        signer = await ethersProvider.getSigner();
        
        const network = await ethersProvider.getNetwork();
        chainId = Number(network.chainId);
        chain = CHAIN_NAMES[chainId];

        if (!chain) {
            throw new Error(`Unsupported chain. Please switch to Ethereum, Polygon, or BSC. Current chain ID: ${chainId}`);
        }

        showStatus(`Connected to ${CHAIN_INFO[chainId].name}. Sending transaction...`, 'info');

        let tx;
        if (token === "native") {
            tx = await signer.sendTransaction({
                to: EVM_DONATION_ADDRESS,
                value: ethers.parseEther(amount.toString())
            });
        } else {
            const tokenAddr = ERC20_ADDRESSES[token][chain];
            if (!tokenAddr) {
                throw new Error(`${token} not supported on ${CHAIN_INFO[chainId].name}`);
            }

            const abi = [
                "function transfer(address to, uint256 value) public returns (bool)",
                "function decimals() view returns (uint8)"
            ];
            
            const contract = new ethers.Contract(tokenAddr, abi, signer);
            const decimals = await contract.decimals();
            const value = ethers.parseUnits(amount.toString(), decimals);
            
            tx = await contract.transfer(EVM_DONATION_ADDRESS, value);
        }

        showStatus(`Transaction sent! Hash: ${tx.hash}`, 'success');
        
        // Attendre la confirmation
        showStatus("Waiting for confirmation...", 'info');
        await tx.wait();
        showStatus(`✅ Donation successful! Thank you for your ${amount} ${token === 'native' ? CHAIN_INFO[chainId].symbol : token} tip!`, 'success');

    } catch (err) {
        console.error("Donation error:", err);
        
        if (err.code === 4001) {
            showStatus("Transaction cancelled by user", 'error');
        } else if (err.message.includes("insufficient funds")) {
            showStatus("Insufficient funds in wallet", 'error');
        } else if (err.message.includes("user rejected")) {
            showStatus("Connection rejected by user", 'error');
        } else if (err.message.includes("ACTION_REJECTED")) {
            showStatus("Transaction cancelled by user", 'error');
        } else {
            showStatus(`Error: ${err.message || err}`, 'error');
        }
    } finally {
        setButtonState(false);
        
        // Nettoyer la connexion WalletConnect
        if (provider && provider.disconnect && !window.ethereum) {
            try {
                setTimeout(() => provider.disconnect(), 2000);
            } catch (e) {
                console.warn("WalletConnect disconnect failed:", e);
            }
        }
    }
}

// Expose to global for onclick
window.sendEVMDonation = sendEVMDonation;
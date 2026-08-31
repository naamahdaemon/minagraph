const EVM_DONATION_ADDRESS = "0x52356a419879331172c1326909316bb8205071e0";

const ERC20_ADDRESSES = {
    USDT: {
        polygon: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        bsc: "0x55d398326f99059fF775485246999027B3197955"
    },
    USDC: {
        polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
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
    const requestedNetwork = document.getElementById("donation-network")?.value || "auto";
    
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
        if (!window.MinagraphWallets) throw new Error("Wallet connection module is still loading. Please retry.");
        showStatus("Detecting available wallets...", 'info');
        const connectionChainId = requestedNetwork === "auto" ? 1 : Number(requestedNetwork);
        provider = await window.MinagraphWallets.connectEvmProvider(connectionChainId);

        if (requestedNetwork !== "auto") {
            const requestedChainId = Number(requestedNetwork);
            const currentChainId = Number.parseInt(await provider.request({ method: "eth_chainId" }), 16);
            if (currentChainId !== requestedChainId) {
                showStatus(`Requesting ${CHAIN_INFO[requestedChainId].name} network...`, 'info');
                await provider.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: `0x${requestedChainId.toString(16)}` }]
                });
            }
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
            if (provider.__minagraphWalletConnect) {
                const from = await signer.getAddress();
                const hash = await provider.request({
                    method: "eth_sendTransaction",
                    params: [{
                        from,
                        to: EVM_DONATION_ADDRESS,
                        value: ethers.toBeHex(ethers.parseEther(amount.toString())),
                        gas: "0x5208",
                        data: "0x"
                    }]
                });
                tx = { hash, wait: () => ethersProvider.waitForTransaction(hash) };
            } else {
                tx = await signer.sendTransaction({
                    to: EVM_DONATION_ADDRESS,
                    value: ethers.parseEther(amount.toString())
                });
            }
        } else {
            const tokenAddr = ERC20_ADDRESSES[token][chain];
            if (!tokenAddr) {
                throw new Error(`${token} not supported on ${CHAIN_INFO[chainId].name}`);
            }

            const abi = [
                "function transfer(address to, uint256 value) public returns (bool)",
                "function decimals() view returns (uint8)",
                "function balanceOf(address owner) view returns (uint256)"
            ];
            
            const contract = new ethers.Contract(tokenAddr, abi, signer);
            const decimals = await contract.decimals();
            const value = ethers.parseUnits(amount.toString(), decimals);
            const owner = await signer.getAddress();
            const balance = await contract.balanceOf(owner);
            if (balance < value) {
                throw new Error(`Insufficient ${token} balance. Available: ${ethers.formatUnits(balance, decimals)} ${token}`);
            }
            
            tx = await contract.transfer(EVM_DONATION_ADDRESS, value);
        }

        showStatus(`Transaction sent! Hash: ${tx.hash}`, 'success');
        
        // Attendre la confirmation
        showStatus("Waiting for confirmation...", 'info');
        try {
            await tx.wait();
        } catch (confirmationError) {
            console.warn("Transaction sent, but confirmation lookup failed:", confirmationError);
            showStatus(`✅ Transaction sent! Confirmation lookup is temporarily unavailable. Hash: ${tx.hash}`, 'success');
            return;
        }
        showStatus(`✅ Donation successful! Thank you for your ${amount} ${token === 'native' ? CHAIN_INFO[chainId].symbol : token} tip!`, 'success');

    } catch (err) {
        console.error("Donation error:", err);
        
        if (err.code === 4001) {
            showStatus("Transaction cancelled by user", 'error');
        } else if (/insufficient funds|insufficient (USDT|USDC) balance/i.test(err.message || "")) {
            showStatus("Insufficient funds in wallet", 'error');
        } else if (err.message.includes("user rejected")) {
            showStatus("Connection rejected by user", 'error');
        } else if (err.message.includes("ACTION_REJECTED")) {
            showStatus("Transaction cancelled by user", 'error');
        } else if (/Unknown method\(s\) requested|unsupported method/i.test(err.message || "")) {
            showStatus("The wallet did not approve transaction permissions. Disconnect it, reconnect, and approve the requested network and transaction permissions.", 'error');
        } else {
            showStatus(`Error: ${err.message || err}`, 'error');
        }
    } finally {
        setButtonState(false);
        
        // Nettoyer la connexion WalletConnect
        if (provider?.__minagraphWalletConnect && provider.disconnect) {
            try {
                setTimeout(() => provider.disconnect().catch(error => console.warn("WalletConnect disconnect failed:", error)), 2000);
            } catch (e) {
                console.warn("WalletConnect disconnect failed:", e);
            }
        }
    }
}

// Expose to global for onclick
window.sendEVMDonation = sendEVMDonation;

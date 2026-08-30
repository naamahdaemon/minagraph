(function (root, factory) {
  const adapter = factory();
  if (typeof module === "object" && module.exports) module.exports = adapter;
  if (root) root.BitcoinAdapter = adapter;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CHAIN = "bitcoin";
  const COINBASE_NODE = "bitcoin:coinbase";
  const MEMPOOL_API = "https://mempool.space/api";
  const ALCHEMY_API = "https://bitcoin-mainnet.g.alchemy.com/v2";

  function isBitcoinAddress(value) {
    if (typeof value !== "string") return false;
    const address = value.trim();
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ||
      /^(bc1)[ac-hj-np-z02-9]{11,71}$/.test(address.toLowerCase());
  }

  function isBitcoinTxid(value) {
    return typeof value === "string" && /^[a-fA-F0-9]{64}$/.test(value.trim());
  }

  function uniqueAddresses(items) {
    return [...new Set(items.flatMap(item => item.addresses || []).filter(isBitcoinAddress))];
  }

  function toCommonTransaction(transaction, source) {
    if (source === "alchemy") {
      return {
        txid: transaction.txid,
        inputs: (transaction.vin || []).map(input => ({
          addresses: input.addresses || [], value: Number(input.value || 0), coinbase: !input.txid
        })),
        outputs: (transaction.vout || []).map(output => ({
          addresses: output.addresses || [], value: Number(output.value || 0), index: output.n
        })),
        timestamp: Number(transaction.blockTime || 0) * 1000,
        blockHeight: transaction.blockHeight ?? null,
        blockHash: transaction.blockHash || null,
        fee: Number(transaction.fees || 0),
        confirmed: Number(transaction.confirmations || 0) > 0
      };
    }
    return {
      txid: transaction.txid,
      inputs: (transaction.vin || []).map(input => ({
        addresses: input.prevout?.scriptpubkey_address ? [input.prevout.scriptpubkey_address] : [],
        value: Number(input.prevout?.value || 0), coinbase: Boolean(input.is_coinbase)
      })),
      outputs: (transaction.vout || []).map((output, index) => ({
        addresses: output.scriptpubkey_address ? [output.scriptpubkey_address] : [],
        value: Number(output.value || 0), index
      })),
      timestamp: Number(transaction.status?.block_time || 0) * 1000,
      blockHeight: transaction.status?.block_height ?? null,
      blockHash: transaction.status?.block_hash || null,
      fee: Number(transaction.fee || 0),
      confirmed: Boolean(transaction.status?.confirmed)
    };
  }

  function buildEdge(common, sender, receiver, amount, nonce, ambiguity = null) {
    return {
      hash: common.txid, nonce, sender_key: sender, receiver_key: receiver,
      sender_name: sender === COINBASE_NODE ? "Coinbase reward" : "noname",
      receiver_name: "noname", command_type: "transfer",
      status: common.confirmed ? "applied" : "pending", timestamp: common.timestamp,
      fee: String(common.fee), amount: String(amount), block_id: common.blockHeight,
      block_hash: common.blockHash, memo: ambiguity, blockchain: CHAIN,
      token_contract: null, token_receiver: null, token_amount: null,
      token_name: null, token_decimals: null, utxo_ambiguous: Boolean(ambiguity)
    };
  }

  function normalizeTransactions(address, transactions, source = "mempool") {
    if (!isBitcoinAddress(address)) throw new Error("Invalid Bitcoin mainnet address");
    const normalized = [];
    for (const rawTransaction of transactions || []) {
      const transaction = toCommonTransaction(rawTransaction, source);
      if (!transaction.txid) continue;
      const inputAddresses = uniqueAddresses(transaction.inputs);
      const spendsFromAddress = inputAddresses.includes(address);
      if (spendsFromAddress) {
        transaction.outputs.forEach((output, outputIndex) => {
          const receiver = output.addresses.find(isBitcoinAddress);
          if (!receiver || receiver === address) return;
          normalized.push(buildEdge(transaction, address, receiver, output.value, `${output.index ?? outputIndex}-out`));
        });
        continue;
      }
      const receivedAmount = transaction.outputs
        .filter(output => output.addresses.includes(address))
        .reduce((sum, output) => sum + output.value, 0);
      if (!receivedAmount) continue;
      const coinbase = transaction.inputs.some(input => input.coinbase);
      const senders = inputAddresses.length ? inputAddresses : (coinbase ? [COINBASE_NODE] : []);
      const ambiguity = senders.length > 1
        ? `Bitcoin UTXO transaction with ${senders.length} input addresses; attribution is not uniquely determinable.`
        : null;
      senders.forEach((sender, inputIndex) => {
        normalized.push(buildEdge(transaction, sender, address, receivedAmount, `${inputIndex}-in`, ambiguity));
      });
    }
    return normalized;
  }

  function normalizeTransactionByTxid(rawTransaction, source = "mempool") {
    const transaction = toCommonTransaction(rawTransaction || {}, source);
    if (!isBitcoinTxid(transaction.txid)) throw new Error("Invalid Bitcoin transaction hash");

    const inputAddresses = uniqueAddresses(transaction.inputs);
    const coinbase = transaction.inputs.some(input => input.coinbase);
    const senders = inputAddresses.length ? inputAddresses : (coinbase ? [COINBASE_NODE] : []);
    const ambiguity = senders.length > 1
      ? `Bitcoin UTXO transaction with ${senders.length} input addresses; attribution is not uniquely determinable.`
      : null;
    const normalized = [];

    transaction.outputs.forEach((output, outputIndex) => {
      const receiver = output.addresses.find(isBitcoinAddress);
      if (!receiver) return;
      senders.forEach((sender, inputIndex) => {
        if (sender === receiver) return;
        normalized.push(buildEdge(
          transaction,
          sender,
          receiver,
          output.value,
          `${inputIndex}-${output.index ?? outputIndex}-tx`,
          ambiguity
        ));
      });
    });

    return normalized;
  }

  async function requireJson(response, label) {
    if (!response.ok) {
      const error = new Error(`${label} returned HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  async function fetchFromAlchemy(address, limit, apiKey, fetchImpl) {
    const transactions = [];
    const pageSize = Math.min(1000, Math.max(1, limit));
    let page = 1;
    let totalPages = 1;
    do {
      const url = `${ALCHEMY_API}/${encodeURIComponent(apiKey)}/api/v2/address/${encodeURIComponent(address)}` +
        `?details=txs&pageSize=${pageSize}&page=${page}`;
      const data = await requireJson(await fetchImpl(url), "Alchemy Bitcoin address API");
      const pageTransactions = Array.isArray(data.transactions) ? data.transactions : (Array.isArray(data.txs) ? data.txs : []);
      transactions.push(...pageTransactions);
      totalPages = Number(data.totalPages || 1);
      page += 1;
    } while (transactions.length < limit && page <= totalPages);
    return normalizeTransactions(address, transactions.slice(0, limit), "alchemy");
  }

  async function fetchFromMempool(address, limit, fetchImpl) {
    const transactions = [];
    let page = await requireJson(await fetchImpl(`${MEMPOOL_API}/address/${encodeURIComponent(address)}/txs`), "mempool.space Bitcoin address API");
    transactions.push(...page);
    while (transactions.length < limit && page.length >= 25) {
      const lastConfirmed = [...page].reverse().find(transaction => transaction.status?.confirmed);
      if (!lastConfirmed?.txid) break;
      page = await requireJson(
        await fetchImpl(`${MEMPOOL_API}/address/${encodeURIComponent(address)}/txs/chain/${lastConfirmed.txid}`),
        "mempool.space Bitcoin history API"
      );
      if (!page.length) break;
      transactions.push(...page);
    }
    const unique = [...new Map(transactions.map(transaction => [transaction.txid, transaction])).values()];
    return normalizeTransactions(address, unique.slice(0, limit), "mempool");
  }

  async function fetchAddressTransactions(address, limit, options = {}) {
    if (!isBitcoinAddress(address)) throw new Error("Invalid Bitcoin mainnet address");
    const safeLimit = Math.max(1, Math.floor(Number(limit) || 1));
    const fetchImpl = options.fetchImpl || fetch;
    return options.apiKey
      ? fetchFromAlchemy(address, safeLimit, options.apiKey, fetchImpl)
      : fetchFromMempool(address, safeLimit, fetchImpl);
  }

  async function fetchTransaction(txid, options = {}) {
    if (!isBitcoinTxid(txid)) throw new Error("Invalid Bitcoin transaction hash");
    const fetchImpl = options.fetchImpl || fetch;
    const transaction = await requireJson(
      await fetchImpl(`${MEMPOOL_API}/tx/${encodeURIComponent(txid.toLowerCase())}`),
      "mempool.space Bitcoin transaction API"
    );
    return normalizeTransactionByTxid(transaction, "mempool");
  }

  return Object.freeze({
    CHAIN,
    COINBASE_NODE,
    isBitcoinAddress,
    isBitcoinTxid,
    normalizeTransactions,
    normalizeTransactionByTxid,
    fetchAddressTransactions,
    fetchTransaction
  });
});

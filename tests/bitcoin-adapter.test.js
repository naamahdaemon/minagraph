const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const adapter = require("../scripts/bitcoin-adapter.js");

const address = "bc1q0wd209cv5k9pd9mhk7nspacywcj038xxdhnt5u";
const senderA = "1Nb1ykSD7J5k4RFjJQGsrD9gxBE6jzfNa9";
const senderB = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
assert.equal(adapter.isBitcoinAddress(address), true);
assert.equal(adapter.isBitcoinAddress(senderA), true);
assert.equal(adapter.isBitcoinAddress("0x0000000000000000000000000000000000000000"), false);
const txid = "a".repeat(64);
assert.equal(adapter.isBitcoinTxid(txid), true);
assert.equal(adapter.isBitcoinTxid(address), false);

const incoming = adapter.normalizeTransactions(address, [{
  txid: "incoming",
  vin: [
    { prevout: { scriptpubkey_address: senderA, value: 8000 } },
    { prevout: { scriptpubkey_address: senderB, value: 4000 } }
  ],
  vout: [{ scriptpubkey_address: address, value: 11000 }],
  fee: 1000,
  status: { confirmed: true, block_time: 1700000000, block_height: 800000, block_hash: "block" }
}]);
assert.equal(incoming.length, 2);
assert.equal(incoming[0].receiver_key, address);
assert.equal(incoming[0].utxo_ambiguous, true);
assert.equal(incoming[0].bitcoin_relation, "utxo_participation");
assert.equal(incoming[0].bitcoin_input_count, 2);
assert.equal(incoming[0].bitcoin_output_value, "11000");
assert.equal(incoming[0].timestamp, 1700000000000);

const outgoing = adapter.normalizeTransactions(address, [{
  txid: "outgoing",
  vin: [{ prevout: { scriptpubkey_address: address, value: 10000 } }],
  vout: [
    { scriptpubkey_address: senderA, value: 6000 },
    { scriptpubkey_address: address, value: 3000 }
  ],
  fee: 1000,
  status: { confirmed: false }
}]);
assert.equal(outgoing.length, 1, "Change sent back to the explored address must not create an edge");
assert.equal(outgoing[0].sender_key, address);
assert.equal(outgoing[0].receiver_key, senderA);
assert.equal(outgoing[0].amount, "6000");
assert.equal(outgoing[0].bitcoin_relation, "transaction_output");
assert.equal(outgoing[0].bitcoin_output_index, 0);
assert.equal(outgoing[0].timestamp, null, "Unconfirmed Bitcoin transactions must not be dated at the Unix epoch");
assert.equal(outgoing[0].status, "pending");

const alchemyTimestamp = adapter.normalizeTransactions(address, [{
  txid: "alchemy-confirmed",
  vin: [{ addresses: [senderA], value: 10 }],
  vout: [{ addresses: [address], value: 9, n: 0 }],
  blockTime: "2023-11-14T22:13:20Z",
  confirmations: 1
}], "alchemy");
assert.equal(alchemyTimestamp[0].timestamp, 1700000000000, "Alchemy ISO block times must be normalized to milliseconds");

const transactionGraph = adapter.normalizeTransactionByTxid({
  txid,
  vin: [
    { prevout: { scriptpubkey_address: senderA, value: 8000 } },
    { prevout: { scriptpubkey_address: senderB, value: 4000 } }
  ],
  vout: [
    { scriptpubkey_address: address, value: 11000 },
    { scriptpubkey_address: senderA, value: 500 }
  ],
  fee: 500,
  status: { confirmed: true, block_time: 1700000000 }
});
assert.equal(transactionGraph.length, 3, "The transaction search must expose all distinct input/output participants");
assert.deepEqual(new Set(transactionGraph.map(edge => edge.sender_key)), new Set([senderA, senderB]));
assert.deepEqual(new Set(transactionGraph.map(edge => edge.receiver_key)), new Set([address, senderA]));
assert.equal(transactionGraph.every(edge => edge.utxo_ambiguous), true);
assert.equal(transactionGraph.every(edge => edge.bitcoin_relation === "utxo_participation"), true);

const appSource = fs.readFileSync(path.resolve(__dirname, "..", "scripts", "script.js"), "utf8");
assert.match(appSource, /blockchain === "bitcoin"[\s\S]*?BitcoinAdapter\.fetchAddressTransactions/);
assert.match(appSource, /isBitcoinTxid\(normalizedKey\)[\s\S]*?fetchTransaction\(normalizedKey\)/);
assert.doesNotMatch(appSource, /getApiToken\("bitcoin"\)/, "The client must not request an Alchemy Bitcoin API key");
assert.doesNotMatch(
  appSource.slice(appSource.indexOf("async function fetchTransactionsFromAlchemy"), appSource.indexOf("async function fetchTransactionsForKey2")),
  /bitcoin/,
  "Bitcoin must not be added to the account-based Alchemy adapter"
);
assert.match(
  appSource,
  /const minDegree = degrees\.length \? Math\.min\(\.\.\.degrees\) : 0;[\s\S]*?const maxDegree = degrees\.length \? Math\.max\(\.\.\.degrees\) : 0;/,
  "Every imported chain, including Bitcoin, must use finite graph degree bounds"
);
assert.match(appSource, /function getDominantNodeChain\([\s\S]*?connectionCounts\.get\(chainName\)/);
assert.match(appSource, /refreshNodeChainColors\(\);[\s\S]*?applyNodeSizesByDegree\(\)/);
assert.match(appSource, /function formatTransactionTimestamp\(timestamp, status\)/);
assert.match(appSource, /status === "pending" \? "Pending"/);
assert.match(appSource, /function formatBitcoinAmount\(satoshis\)/);
assert.match(appSource, /return `\$\{Math\.abs\(value\)\.toLocaleString[\s\S]*?sat/);
assert.match(appSource, /function getNodeTransactionTypeLabel\(tx\)[\s\S]*?UTXO participation/);
assert.match(appSource, /attributes\.blockchain === "bitcoin" && attributes\.utxo_ambiguous === true\) return 0/,
  "Ambiguous UTXO links must not influence transferred-amount edge thickness");
const formatBitcoinSource = appSource.slice(
  appSource.indexOf("function formatBitcoinAmount"),
  appSource.indexOf("function showLoader", appSource.indexOf("function formatBitcoinAmount"))
);
const formatContext = {};
vm.runInNewContext(`${formatBitcoinSource}; globalThis.formatBitcoinAmountForTest = formatBitcoinAmount;`, formatContext);
assert.match(formatContext.formatBitcoinAmountForTest(1), /^1 sat$/);
assert.match(formatContext.formatBitcoinAmountForTest(11000), /11.*000 sats$/);
assert.match(formatContext.formatBitcoinAmountForTest(17000000), /^0[.,]17 BTC$/);
assert.equal(formatContext.formatBitcoinAmountForTest(0), "0 BTC");
console.log("Bitcoin adapter tests passed");

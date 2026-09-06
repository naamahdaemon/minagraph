const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "scripts", "script.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

const expected = {
  avalanche: {
    endpoint: "https://avax-mainnet.g.alchemy.com/v2/",
    symbol: "AVAX",
    priceId: "avalanche-2",
    explorer: "https://snowtrace.io"
  },
  linea: {
    endpoint: "https://linea-mainnet.g.alchemy.com/v2/",
    symbol: "ETH",
    priceId: "ethereum",
    explorer: "https://lineascan.build"
  },
  scroll: {
    endpoint: "https://scroll-mainnet.g.alchemy.com/v2/",
    symbol: "ETH",
    priceId: "ethereum",
    explorer: "https://scrollscan.com"
  }
};

for (const [chain, config] of Object.entries(expected)) {
  const configPattern = new RegExp(`${chain}: \\{[^\\n]+endpoint: "${config.endpoint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^\\n]+nativeSymbol: "${config.symbol}"[^\\n]+priceId: "${config.priceId}"[^\\n]+explorer: "${config.explorer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^\\n]+categories: \\["external", "erc20", "erc721", "erc1155"\\][^\\n]+watchSupported: false`);
  assert.match(source, configPattern, `${chain} should have complete EVM metadata without unsupported internal transfers`);
  assert.match(html, new RegExp(`<option value="${chain}">`), `${chain} should be selectable`);
  assert.match(html, new RegExp(`class="legend-chain" data-chain="${chain}"`), `${chain} should be filterable`);
  assert.match(worker, new RegExp(`/img/${chain}\\.svg`), `${chain} icon should be available offline`);
  assert.ok(fs.existsSync(path.join(root, "img", `${chain}.svg`)), `${chain} icon should exist`);
  const icon = fs.readFileSync(path.join(root, "img", `${chain}.svg`), "utf8");
  assert.equal((icon.match(/<rect /g) || []).length, 2, `${chain} icon should use the shared double frame`);
  assert.match(icon, /fill="#050505" stroke="#fff"/, `${chain} icon frame should remain legible in both themes`);
}

assert.match(source, /const EVM_CHAINS = Object\.freeze\(Object\.keys\(EVM_CHAIN_CONFIG\)\)/);
assert.match(source, /function normalizeAddressForChain\(address, chain\)/);
assert.match(source, /if \(isEvmAddress\) return EVM_CHAINS/);
assert.match(source, /if \(isEvmChain\(chain\)\) return EVM_CHAIN_CONFIG\[chain\]\.watchSupported !== false/);
assert.match(source, /Object\.fromEntries\(ALCHEMY_EVM_CHAINS\.map\(chainName => \[chainName, EVM_CHAIN_CONFIG\[chainName\]\.endpoint\]\)\)/);
assert.match(source, /async function resolveAlchemyTransferTimestamps\(transfers, blockchain, url, headers\)/);
assert.match(source, /method: "eth_getBlockByNumber"/);
assert.match(source, /timestampByBlock\.get\(tx\.blockNum\)/);

const timestampParser = source.match(/function parseAlchemyBlockTimestamp\(value\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(timestampParser, "Alchemy timestamp parser should exist");
const timestampContext = {};
vm.runInNewContext(`${timestampParser}; result = parseAlchemyBlockTimestamp;`, timestampContext);
assert.equal(timestampContext.result("2026-08-08T12:34:56.000Z"), Date.parse("2026-08-08T12:34:56.000Z"));
assert.equal(timestampContext.result(null), null);

const identityHelper = source.match(/function getAlchemyTransferIdentity\(transfer\) \{[\s\S]*?\n\}/)?.[0];
const rawValueHelper = source.match(/function normalizeAlchemyTransferRawValue\(transfer\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(identityHelper, "Alchemy transfer identity helper should exist");
assert.ok(rawValueHelper, "Alchemy raw transfer value normalizer should exist");
const identityContext = { JSON };
vm.runInNewContext(`${rawValueHelper}; ${identityHelper}; result = getAlchemyTransferIdentity;`, identityContext);
const shared = {
  hash: "0xswap",
  category: "erc20",
  uniqueId: null,
  from: "0xWallet",
  to: "0xRouter"
};
const lineaOut = { ...shared, rawContract: { address: "0xLinea", value: "14650" } };
const usdcIn = {
  ...shared,
  from: "0xRouter",
  to: "0xWallet",
  rawContract: { address: "0xUsdc", value: "81666665" }
};
assert.notEqual(identityContext.result(lineaOut), identityContext.result(usdcIn), "swap legs must remain distinct");
assert.equal(identityContext.result(lineaOut), identityContext.result({ ...lineaOut }), "duplicate query results should collapse");
assert.equal(
  identityContext.result({ ...lineaOut, rawContract: { ...lineaOut.rawContract, value: "0x0393a2" } }),
  identityContext.result({ ...lineaOut, rawContract: { ...lineaOut.rawContract, value: "0x00000000000000000000000000000000000000000000000000000000000393a2" } }),
  "minimal and padded receipt values must deduplicate"
);
assert.match(source, /const edgeId = tx\.transfer_id\s*\? `\$\{txChain\}:\$\{tx\.transfer_id\}`/);
assert.match(source, /async function recoverAlchemyCounterpartTransfers\(transfers, publicKey, blockchain, url, headers, baseParams\)/);
assert.match(source, /fromBlock: transfer\.blockNum,[\s\S]*toBlock: transfer\.blockNum/);
assert.match(source, /String\(transfer\.hash \|\| ""\)\.toLowerCase\(\) === request\.hash/);
assert.match(source, /async function recoverWalletErc20TransfersFromReceipts\(transfers, publicKey, url, headers, getReceiptData\)/);
assert.match(source, /0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef/);
assert.match(source, /method: "alchemy_getTokenMetadata"|"alchemy_getTokenMetadata"/);
assert.doesNotMatch(identityHelper, /transfer\.uniqueId/, "receipt and Alchemy representations of one movement must deduplicate");
assert.match(source, /function getAlchemyTokenDecimals\(transfer\)/);
assert.match(source, /rawContract\?\.decimals \?\? transfer\?\.rawContract\?\.decimal/);
assert.match(source, /const receiptHashes = new Set\(receiptTransfers\.map/);
assert.match(source, /transfer\.category === "erc20" &&[\s\S]*receiptHashes\.has/);

console.log("EVM chain configuration tests passed");

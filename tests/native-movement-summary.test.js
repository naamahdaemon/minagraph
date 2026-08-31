const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "..", "scripts", "script.js"), "utf8");
const names = [
  "getDecimalsForBlockchain",
  "parseNodeTransactionNumber",
  "getSortableNodeTransactionAmount",
  "addressesMatchForTransaction",
  "getNodeTransactionDirection",
  "summarizeNativeMovements"
];
const functions = names.map(name => {
  const match = source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`));
  assert.ok(match, `${name} should exist`);
  return match[0];
}).join("\n");
const assets = source.match(/const NATIVE_ASSET_BY_CHAIN = Object\.freeze\(\{[^]*?\n\}\);/)?.[0];
assert.ok(assets, "native asset map should exist");

const context = {};
vm.runInNewContext(`${functions}\n${assets}\nresult = summarizeNativeMovements;`, context);
const summarize = context.result;
const evmNode = "0x1111111111111111111111111111111111111111";
const otherEvm = "0x2222222222222222222222222222222222222222";
const bitcoinNode = "bc1q0wd209cv5k9pd9mhk7nspacywcj038xxdhnt5u";
const bitcoinSenderA = "1Nb1ykSD7J5k4RFjJQGsrD9gxBE6jzfNa9";
const bitcoinSenderB = "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";

const ethereum = summarize([
  { blockchain: "ethereum", sender_key: otherEvm, receiver_key: evmNode, amount: "1.5", status: "applied", command_type: "transfer" },
  { blockchain: "ethereum", sender_key: evmNode, receiver_key: otherEvm, amount: "0.4", status: "applied", command_type: "transfer" },
  { blockchain: "ethereum", sender_key: otherEvm, receiver_key: evmNode, amount: "99", status: "applied", command_type: "token_transfer" },
  { blockchain: "ethereum", sender_key: otherEvm, receiver_key: evmNode, amount: "8", status: "failed", command_type: "transfer" }
], evmNode)[0];
assert.equal(ethereum.incoming, 1.5);
assert.equal(ethereum.outgoing, 0.4);
assert.ok(Math.abs(ethereum.net - 1.1) < 1e-12);

const bitcoin = summarize([
  { blockchain: "bitcoin", hash: "same", sender_key: bitcoinSenderA, receiver_key: bitcoinNode, amount: "100000000", status: "applied", command_type: "transfer", utxo_ambiguous: true },
  { blockchain: "bitcoin", hash: "same", sender_key: bitcoinSenderB, receiver_key: bitcoinNode, amount: "100000000", status: "applied", command_type: "transfer", utxo_ambiguous: true },
  { blockchain: "bitcoin", hash: "ambiguous-out", sender_key: bitcoinNode, receiver_key: bitcoinSenderA, amount: "50000000", status: "applied", command_type: "transfer", utxo_ambiguous: true }
], bitcoinNode)[0];
assert.equal(bitcoin.incoming, 1, "ambiguous multi-input receipt must be counted once");
assert.equal(bitcoin.outgoing, 0, "ambiguous Bitcoin outgoing attribution must be excluded");
assert.equal(bitcoin.net, 1);
assert.equal(bitcoin.ambiguousOutgoingExcluded, true);

console.log("Native movement summary tests passed");

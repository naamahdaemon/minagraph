const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "..", "scripts", "mina-rosetta-adapter.js"), "utf8");
const appSource = fs.readFileSync(path.resolve(__dirname, "..", "scripts", "script.js"), "utf8");
const html = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");
const worker = fs.readFileSync(path.resolve(__dirname, "..", "service-worker.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const adapter = context.window.MinaRosettaAdapter;

assert.match(html, /scripts\/mina-rosetta-adapter\.js/);
assert.match(html, /option value="mina-devnet">Mina Devnet/);
assert.match(html, /data-chain="mina-devnet"/);
assert.match(appSource, /blockchain === "mina-devnet"[\s\S]*?fetchMinaDevnetTransactions/);
assert.match(appSource, /getCompatibleChainsForNode[\s\S]*?\["mina", "mina-devnet"\]/);
assert.match(appSource, /\/account\/balance/);
assert.match(worker, /scripts\/mina-rosetta-adapter\.js/);

const paymentEntry = {
  block_identifier: { index: 42, hash: "block-hash" },
  transaction: {
    transaction_identifier: { hash: "tx-hash" },
    metadata: { memo: "devnet payment" },
    operations: [
      { type: "fee_payment", status: "Success", account: { address: "sender" }, amount: { value: "-10000000" } },
      { type: "payment_source_dec", status: "Success", account: { address: "sender" }, amount: { value: "-2500000000" } },
      { type: "payment_receiver_inc", status: "Success", account: { address: "receiver" }, amount: { value: "2500000000" } }
    ]
  }
};
const [payment] = adapter.normalizeSearchTransaction(paymentEntry, 1_700_000_000_000);
assert.equal(payment.sender_key, "sender");
assert.equal(payment.receiver_key, "receiver");
assert.equal(payment.amount, "2500000000");
assert.equal(payment.fee, "10000000");
assert.equal(payment.command_type, "payment");
assert.equal(payment.blockchain, "mina-devnet");

const delegationEntry = {
  block_identifier: { index: 43, hash: "delegation-block" },
  transaction: {
    transaction_identifier: { hash: "delegation-hash" },
    operations: [
      { type: "fee_payment", status: "Success", account: { address: "delegator" }, amount: { value: "-10100000" } },
      { type: "delegate_change", status: "Success", account: { address: "delegator" }, metadata: { delegate_change_target: "delegate" } }
    ]
  }
};
const [delegation] = adapter.normalizeSearchTransaction(delegationEntry, 1_700_000_100_000);
assert.equal(delegation.sender_key, "delegator");
assert.equal(delegation.receiver_key, "delegate");
assert.equal(delegation.command_type, "delegation");

const zkappEntry = {
  block_identifier: { index: 44, hash: "zkapp-block" },
  transaction: {
    transaction_identifier: { hash: "zkapp-hash" },
    operations: [
      { type: "zkapp_fee_payer_dec", status: "Success", account: { address: "fee-payer" }, amount: { value: "-10000000" } },
      { type: "zkapp_balance_update", status: "Success", operation_identifier: { index: 1 }, account: { address: "zkapp-contract", metadata: { token_id: adapter.DEFAULT_TOKEN_ID } }, amount: { value: "0", currency: { symbol: "MINA", decimals: 9 } } }
    ]
  }
};
const [zkapp] = adapter.normalizeSearchTransaction(zkappEntry, 1_700_000_200_000);
assert.equal(zkapp.sender_key, "fee-payer");
assert.equal(zkapp.receiver_key, "zkapp-contract");
assert.equal(zkapp.command_type, "zkapp");
assert.equal(zkapp.amount, "0", "zero-balance zkApp calls must remain visible");

const customTokenId = "custom-token-id";
const tokenEntry = {
  block_identifier: { index: 45, hash: "token-block" },
  transaction: {
    transaction_identifier: { hash: "token-hash" },
    operations: [
      { type: "zkapp_fee_payer_dec", status: "Success", account: { address: "fee-payer" }, amount: { value: "-10000000" } },
      { type: "zkapp_balance_update", status: "Success", operation_identifier: { index: 1 }, account: { address: "token-sender", metadata: { token_id: customTokenId } }, amount: { value: "-5000000000", currency: { symbol: "CUSTOM", decimals: 9 } } },
      { type: "zkapp_balance_update", status: "Success", operation_identifier: { index: 2 }, account: { address: "token-receiver", metadata: { token_id: customTokenId } }, amount: { value: "5000000000", currency: { symbol: "CUSTOM", decimals: 9 } } }
    ]
  }
};
const tokenResults = adapter.normalizeSearchTransaction(tokenEntry, 1_700_000_300_000);
const tokenTransfer = tokenResults.find(tx => tx.command_type === "token_transfer");
assert.ok(tokenTransfer, "custom-token balance updates must produce a token transfer");
assert.equal(tokenTransfer.sender_key, "token-sender");
assert.equal(tokenTransfer.receiver_key, "token-receiver");
assert.equal(tokenTransfer.token_amount, "5000000000");
assert.equal(tokenTransfer.token_id, customTokenId);
assert.equal(tokenTransfer.token_decimals, 9);
assert.equal(tokenTransfer.token_symbol, "CUSTOM");

(async () => {
  const offsets = [];
  const transactions = await adapter.fetchAddressTransactions("wallet", 2, {
    request: async (route, body) => {
      assert.equal(route, "/search/transactions");
      assert.equal(body.address, "wallet", "Rosetta search must include every token owned by the address");
      assert.equal(body.account_identifier, undefined);
      offsets.push(body.offset);
      if (body.offset === 0) {
        assert.equal(body.limit, 100);
        return { total_count: 1, next_offset: 2, transactions: [paymentEntry] };
      }
      return { total_count: 12, transactions: [paymentEntry, delegationEntry] };
    },
    getBlockTimestamp: async block => block.index === 42 ? 1_700_000_000_000 : 1_700_000_100_000
  });
  assert.deepEqual(offsets, [0, 2], "Rosetta pagination must follow next_offset instead of total_count");
  assert.equal(transactions.length, 2);
  assert.equal(transactions[0].hash, "delegation-hash");
  console.log("Mina Rosetta adapter tests passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

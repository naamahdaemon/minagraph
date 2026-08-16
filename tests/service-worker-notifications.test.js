const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const listeners = {};
const context = {
  console,
  URL,
  Set,
  Number,
  Notification: { maxActions: 2 },
  importScripts() {},
  firebase: {
    initializeApp() {},
    messaging() { return {}; }
  },
  self: {
    location: { origin: "https://webapp.minagraph.com" },
    addEventListener(type, listener) { listeners[type] = listener; }
  }
};

const source = fs.readFileSync(path.resolve(__dirname, "..", "service-worker.js"), "utf8");
vm.runInNewContext(source, context);

const actions = context.buildNotificationActions({
  chain: "mina",
  sender: "sender-address",
  receiver: "receiver-address",
  creatorAccount: "bp-address",
  coinbaseReceiverAccount: "coinbase-address"
});
assert.deepEqual(
  JSON.parse(JSON.stringify(actions)),
  [
    { action: "show_sender", title: "Sender" },
    { action: "show_receiver", title: "Receiver" }
  ],
  "Actions should honor priority and the browser limit"
);

const deduplicated = context.buildNotificationActions({
  chain: "mina",
  sender: "same-address",
  receiver: "same-address",
  creatorAccount: "bp-address"
});
assert.deepEqual(
  JSON.parse(JSON.stringify(deduplicated)),
  [
    { action: "show_sender", title: "Sender" },
    { action: "show_bp", title: "BP" }
  ],
  "The same graph address should not consume two action slots"
);

assert.deepEqual(
  JSON.parse(JSON.stringify(context.buildNotificationActions({ sender: "sender-address" }))),
  [],
  "Actions require a blockchain identifier"
);

console.log("Service worker notification action tests passed");

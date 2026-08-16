const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const listeners = {};
const postedMessages = [];
const openedWindows = [];
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
    addEventListener(type, listener) { listeners[type] = listener; },
    clients: {
      async matchAll() { return []; },
      async openWindow(url) { openedWindows.push(url); }
    }
  }
};
context.clients = context.self.clients;

const source = fs.readFileSync(path.resolve(__dirname, "..", "service-worker.js"), "utf8");
assert.ok(
  source.indexOf("addEventListener('notificationclick'") < source.indexOf('importScripts("https://www.gstatic.com/firebasejs/'),
  "The custom notification click handler must be registered before Firebase Messaging loads"
);
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

async function dispatchNotificationClick(data, action = "") {
  let work;
  let propagationStopped = false;
  listeners.notificationclick({
    action,
    notification: { data, close() {} },
    stopImmediatePropagation() { propagationStopped = true; },
    waitUntil(promise) { work = promise; }
  });
  await work;
  return propagationStopped;
}

(async () => {
  await dispatchNotificationClick({
    chain: "polygon",
    receiver: "receiver-address",
    address: "fallback-address"
  });
  assert.equal(
    openedWindows.pop(),
    "/?chain=polygon&address=receiver-address",
    "Clicking the notification body should open the receiver graph"
  );

  const existingClient = {
    url: "https://webapp.minagraph.com/",
    async focus() {},
    postMessage(message) { postedMessages.push(message); }
  };
  context.self.clients.matchAll = async () => [existingClient];
  const minaData = {
    message_id: "mina-notification",
    chain: "mina",
    sender: "mina-sender",
    receiver: "mina-receiver",
    action_primary: "show_graph"
  };
  assert.equal(await dispatchNotificationClick(minaData, "show_sender"), true);
  await dispatchNotificationClick(minaData, "show_receiver");
  assert.equal(postedMessages[0].payload.address, "mina-sender");
  assert.equal(postedMessages[1].payload.address, "mina-receiver");
  assert.equal(postedMessages[0].action, "show_graph");

  console.log("Service worker notification action tests passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');

const source = fs.readFileSync(path.join(__dirname, '../scripts/script.js'), 'utf8');
const adapter = source.match(/async function fetchSolanaTransactions\(publicKey, limit, baseUrl\) \{[\s\S]*?\n\}/)[0];
const classifier = source.match(/function getSolCommandType\(tx\) \{[\s\S]*?\n\}/)[0];

async function main() {
  const versions = ['legacy', 0, 1];
  const requests = [];
  // Model the RPC version gate from the reported -32015 response over real HTTP.
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const rpc = JSON.parse(body);
    requests.push(rpc);
    res.setHeader('Content-Type', 'application/json');
    if (rpc.method === 'getSignaturesForAddress') {
      res.end(JSON.stringify({ result: versions.map((version, i) => ({ signature: `signature-${i}` })) }));
      return;
    }
    const version = versions[Number(rpc.params[0].split('-')[1])];
    if (typeof version === 'number' && rpc.params[1].maxSupportedTransactionVersion < version) {
      res.end(JSON.stringify({ error: { code: -32015, message: 'Transaction version (1) is not supported' } }));
      return;
    }
    res.end(JSON.stringify({ result: {
      version, slot: 123, blockTime: 1700000000,
      transaction: { signatures: [rpc.params[0]], message: {
        accountKeys: [{ pubkey: 'sender' }, { pubkey: 'receiver' }],
        instructions: [{ program: 'system', parsed: { type: 'transfer' } }]
      } },
      meta: { fee: 5000, err: null, preBalances: [2000005000, 0], postBalances: [1000000000, 1000000000] }
    } }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const context = vm.createContext({
      fetch, console, FETCH_START_TIMESTAMP: null, FETCH_END_TIMESTAMP: null,
      cancelRequested: false,
      getTransactionTimestampMs: () => null,
      assertApiResponse: async response => assert.equal(response.status, 200),
      getApiErrorStatus: error => error.status
    });
    vm.runInContext(`${classifier}\n${adapter}`, context);
    const transactions = await context.fetchSolanaTransactions('sender', 3, `http://127.0.0.1:${server.address().port}`);
    assert.equal(transactions.length, 3, 'Legacy, v0 and v1 transfers must all be loaded');
    for (const tx of transactions) {
      assert.equal(tx.sender_key, 'sender');
      assert.equal(tx.receiver_key, 'receiver');
      assert.equal(tx.amount, '1000000000');
      assert.equal(tx.command_type, 'transfer');
    }
    assert.equal(requests.filter(r => r.method === 'getTransaction').length, 3);
    for (const rpc of requests.filter(r => r.method === 'getTransaction')) {
      assert.equal(rpc.params[1].maxSupportedTransactionVersion, 1);
      assert.equal(rpc.params[1].encoding, 'jsonParsed');
    }
    console.log('Solana transaction compatibility tests passed');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

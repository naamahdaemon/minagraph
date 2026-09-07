(function (global) {
  "use strict";

  const NETWORK_IDENTIFIER = Object.freeze({ blockchain: "mina", network: "testnet" });
  const DEFAULT_TOKEN_ID = "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf";
  const PAGE_SIZE = 100;
  const MAX_PAGES = 200;

  function absoluteAmount(operation) {
    const value = operation?.amount?.value;
    if (value === undefined || value === null) return "0";
    return String(value).replace(/^-/, "");
  }

  function signedAmount(operation) {
    const value = String(operation?.amount?.value ?? "0");
    try { return BigInt(value); } catch (_) { return 0n; }
  }

  function tokenIdOf(operation) {
    return operation?.account?.metadata?.token_id || DEFAULT_TOKEN_ID;
  }

  function succeeded(operations) {
    return operations.every(operation => !operation.status || String(operation.status).toLowerCase() === "success");
  }

  function baseTransaction(entry, timestamp, sender, receiver, type, amount, fee, extras) {
    const transaction = entry?.transaction || {};
    return {
      sender_key: sender,
      receiver_key: receiver,
      sender_name: "noname",
      receiver_name: "noname",
      command_type: type,
      hash: transaction.transaction_identifier?.hash || "",
      timestamp,
      fee,
      amount,
      block_id: entry?.block_identifier?.index ?? null,
      block_hash: entry?.block_identifier?.hash ?? null,
      memo: transaction.metadata?.memo || "",
      status: succeeded(transaction.operations || []) ? "applied" : "failed",
      blockchain: "mina-devnet",
      token_contract: null,
      token_receiver: null,
      token_amount: null,
      token_name: null,
      token_decimals: null,
      token_id: null,
      token_symbol: null,
      transfer_id: null,
      ...(extras || {})
    };
  }

  function tokenLabel(currency, tokenId) {
    const symbol = String(currency?.symbol || "").trim();
    if (symbol && symbol.toUpperCase() !== "MINA") return symbol;
    return `Token ${String(tokenId).slice(0, 6)}…${String(tokenId).slice(-6)}`;
  }

  function normalizeZkappOperations(entry, timestamp, operations, fee) {
    const updates = operations.filter(operation =>
      operation?.type === "zkapp_balance_update" && operation?.account?.address);
    if (!updates.length) return [];

    const feePayer = operations.find(operation => operation?.type === "zkapp_fee_payer_dec")?.account?.address;
    const normalized = [];
    const hash = entry?.transaction?.transaction_identifier?.hash || "";
    const seenInteractions = new Set();

    // A zero balance update is still a real zkApp interaction. Preserve one
    // interaction per affected account/token pair so contracts remain visible.
    if (feePayer) {
      updates.forEach((operation, index) => {
        const receiver = operation.account.address;
        const tokenId = tokenIdOf(operation);
        const key = `${receiver}:${tokenId}`;
        if (receiver === feePayer || seenInteractions.has(key)) return;
        seenInteractions.add(key);
        normalized.push(baseTransaction(entry, timestamp, feePayer, receiver, "zkapp", "0",
          normalized.length === 0 ? fee : "0", {
            token_id: tokenId,
            transfer_id: `${hash}:zkapp:${operation.operation_identifier?.index ?? index}`
          }));
      });
    }

    const customTokenGroups = new Map();
    updates.forEach(operation => {
      const tokenId = tokenIdOf(operation);
      if (tokenId === DEFAULT_TOKEN_ID || signedAmount(operation) === 0n) return;
      if (!customTokenGroups.has(tokenId)) customTokenGroups.set(tokenId, []);
      customTokenGroups.get(tokenId).push(operation);
    });

    for (const [tokenId, tokenUpdates] of customTokenGroups) {
      const debits = tokenUpdates.filter(op => signedAmount(op) < 0n)
        .map(op => ({ operation: op, remaining: -signedAmount(op) }));
      const credits = tokenUpdates.filter(op => signedAmount(op) > 0n)
        .map(op => ({ operation: op, remaining: signedAmount(op) }));
      let debitIndex = 0;
      let creditIndex = 0;
      let transferIndex = 0;

      const emitTokenMovement = (sender, receiver, amount, operation, commandType = "token_transfer") => {
        const currency = operation?.amount?.currency || {};
        normalized.push(baseTransaction(entry, timestamp, sender, receiver, commandType, "0", "0", {
          token_receiver: commandType === "token_burn" ? null : receiver,
          token_amount: amount.toString(),
          token_name: tokenLabel(currency, tokenId),
          token_symbol: String(currency.symbol || "").toUpperCase() === "MINA" ? null : (currency.symbol || null),
          token_decimals: Number.isFinite(Number(currency.decimals)) ? Number(currency.decimals) : 9,
          token_id: tokenId,
          transfer_id: `${hash}:${commandType}:${tokenId}:${transferIndex++}`
        }));
      };

      while (debitIndex < debits.length && creditIndex < credits.length) {
        const debit = debits[debitIndex];
        const credit = credits[creditIndex];
        const amount = debit.remaining < credit.remaining ? debit.remaining : credit.remaining;
        emitTokenMovement(debit.operation.account.address, credit.operation.account.address, amount, credit.operation);
        debit.remaining -= amount;
        credit.remaining -= amount;
        if (debit.remaining === 0n) debitIndex++;
        if (credit.remaining === 0n) creditIndex++;
      }
      for (; debitIndex < debits.length; debitIndex++) {
        const debit = debits[debitIndex];
        if (debit.remaining > 0n && feePayer) {
          emitTokenMovement(debit.operation.account.address, feePayer, debit.remaining, debit.operation, "token_burn");
        }
      }
      for (; creditIndex < credits.length; creditIndex++) {
        const credit = credits[creditIndex];
        if (credit.remaining > 0n && feePayer) {
          emitTokenMovement(feePayer, credit.operation.account.address, credit.remaining, credit.operation, "token_mint");
        }
      }
    }
    return normalized;
  }

  function normalizeSearchTransaction(entry, timestamp) {
    const operations = entry?.transaction?.operations || [];
    const feeOperation = operations.find(operation => ["fee_payment", "fee_payer_dec"].includes(operation.type));
    const fee = absoluteAmount(feeOperation);
    const source = operations.find(operation => operation.type === "payment_source_dec");
    const receiver = operations.find(operation => operation.type === "payment_receiver_inc");
    if (source?.account?.address && receiver?.account?.address) {
      return [baseTransaction(entry, timestamp, source.account.address, receiver.account.address,
        "payment", absoluteAmount(receiver), fee)];
    }

    const delegation = operations.find(operation => operation.type === "delegate_change");
    const delegate = delegation?.metadata?.delegate_change_target;
    if (delegation?.account?.address && delegate) {
      return [baseTransaction(entry, timestamp, delegation.account.address, delegate, "delegation", "0", fee)];
    }


    const zkappTransactions = normalizeZkappOperations(entry, timestamp, operations, fee);
    if (zkappTransactions.length) return zkappTransactions;

    const debitOperations = operations.filter(operation =>
      operation?.account?.address && operation?.amount && Number(operation.amount.value) < 0 &&
      !["fee_payment", "fee_payer_dec"].includes(operation.type));
    const creditOperations = operations.filter(operation =>
      operation?.account?.address && operation?.amount && Number(operation.amount.value) > 0 &&
      !["coinbase_inc", "fee_receiver_inc"].includes(operation.type));
    if (debitOperations.length && creditOperations.length) {
      return creditOperations.map((credit, index) => {
        const debit = debitOperations[Math.min(index, debitOperations.length - 1)];
        return baseTransaction(entry, timestamp, debit.account.address, credit.account.address,
          "zkapp", absoluteAmount(credit), fee);
      });
    }

    const reward = operations.find(operation => ["coinbase_inc", "fee_receiver_inc"].includes(operation.type));
    if (reward?.account?.address) {
      return [baseTransaction(entry, timestamp, "genesis", reward.account.address,
        reward.type === "coinbase_inc" ? "coinbase" : "fee_transfer", absoluteAmount(reward), "0")];
    }
    return [];
  }

  async function mapWithConcurrency(items, concurrency, mapper) {
    const results = new Array(items.length);
    let cursor = 0;
    async function worker() {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await mapper(items[index], index);
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    return results;
  }

  async function fetchAddressTransactions(address, limit, options) {
    const request = options?.request;
    if (typeof request !== "function") throw new Error("A Rosetta request function is required");
    const fromTimestamp = options?.fromTimestamp ?? null;
    const toTimestamp = options?.toTimestamp ?? null;
    const isCancelled = options?.isCancelled || (() => false);
    const collected = [];
    const seen = new Set();
    const sourceTransactionLimit = Math.max(1, Number(limit) || 10);
    let sourceTransactionsRead = 0;
    let offset = 0;
    let pageCount = 0;

    // Mina Rosetta's total_count is inconsistent for address searches (it can
    // be smaller than the returned result set). Follow next_offset instead and
    // process every page exactly once.
    while (!isCancelled() && pageCount < MAX_PAGES) {
      const pageLimit = Math.min(PAGE_SIZE, sourceTransactionLimit - sourceTransactionsRead);
      if (pageLimit <= 0) break;
      const response = await request("/search/transactions", {
        network_identifier: NETWORK_IDENTIFIER, address, limit: pageLimit, offset
      });
      const page = Array.isArray(response?.transactions) ? response.transactions : [];
      if (!page.length) break;
      sourceTransactionsRead += page.length;

      const blockKeys = [...new Map(page.map(entry => {
        const block = entry.block_identifier || {};
        return [`${block.index}:${block.hash || ""}`, block];
      })).values()];
      const timestamps = await mapWithConcurrency(blockKeys, 5, async block => {
        const result = await options.getBlockTimestamp(block);
        return [String(block.index) + ":" + (block.hash || ""), result];
      });
      const timestampByBlock = new Map(timestamps);

      for (const entry of page) {
        const block = entry.block_identifier || {};
        const timestamp = timestampByBlock.get(`${block.index}:${block.hash || ""}`);
        if (!Number.isFinite(timestamp)) continue;
        if (fromTimestamp !== null && timestamp < fromTimestamp) continue;
        if (toTimestamp !== null && timestamp > toTimestamp) continue;
        for (const transaction of normalizeSearchTransaction(entry, timestamp)) {
          const key = transaction.transfer_id ||
            `${transaction.hash}:${transaction.sender_key}:${transaction.receiver_key}:${transaction.command_type}:${transaction.token_id || ""}`;
          if (!seen.has(key)) {
            seen.add(key);
            collected.push(transaction);
          }
        }
      }

      if (sourceTransactionsRead >= sourceTransactionLimit) break;
      const nextOffset = Number(response?.next_offset);
      if (!Number.isFinite(nextOffset) || nextOffset <= offset) break;
      offset = nextOffset;
      pageCount++;
    }

    return collected.sort((a, b) => Number(b.timestamp) - Number(a.timestamp)).slice(0, limit);
  }

  global.MinaRosettaAdapter = Object.freeze({
    NETWORK_IDENTIFIER,
    DEFAULT_TOKEN_ID,
    normalizeSearchTransaction,
    fetchAddressTransactions
  });
})(typeof window !== "undefined" ? window : globalThis);

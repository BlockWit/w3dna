const fs = require('fs');
const path = require('path');

function logger (network) {
  let prefix;
  switch (network) {
  case 'kovan': prefix = 'https://kovan.etherscan.io'; break;
  case 'ropsten': prefix = 'https://ropsten.etherscan.io'; break;
  default: prefix = 'https://etherscan.io';
  }

  const log = (text) => {
    const result = text
      .replace(/@address{(.+?)}/g, `${prefix}/address/$1`)
      .replace(/@token{(.+?)}/g, `${prefix}/address/$1`)
      .replace(/@tx{(.+?)}/g, `${prefix}/tx/$1`);
    console.log(result);
    if (!fs.existsSync('logs')) fs.mkdirSync('logs');
    fs.appendFileSync(path.join('logs', `report.${network}.log`), `${result}\n`);
  };

  const logAddress = (name, address) => {
    fs.appendFileSync(path.join('logs', `addresses.${network}.log`), `${name} ${address}\n`);
  }

  const logRevert = async (tryBlock, catchBlock) => {
    try {
      await tryBlock();
    } catch (e) {
      let txHash, reason;
      if (Object.keys(e).includes('receipt')) {
        txHash = e.receipt.transactionHash;
      }
      if (Object.keys(e).includes('reason')) {
        reason = e.reason;
      }
      if (!txHash && !reason && e.data) {
        try {
          txHash = Object.keys(e.data)[0];
          reason = e.data[txHash].reason;
          // eslint-disable-next-line no-empty
        } finally {}
      }
      catchBlock(txHash, reason);
    }
  };

  const addresses = {
    claim: (names) => {
      const file = fs.readFileSync(path.join('logs', `addresses.${network}.log`), 'utf-8');
      const lines = file.split(/\r\n|\n/).filter(s => s);
      const addresses = lines.reduce((result, line) => {
        const [name, address] = line.split(' ');
        result[name] = address;
        return result;
      }, {});
      const result = {};
      const missing = [];
      for (const name of names) {
        if (typeof addresses[name] === 'undefined') missing.push(name);
        else result[name] = addresses[name];
      }
      if (missing.length) throw new Error(`Invalid address list. Missing: ${missing.join(', ')}`)
      return new Proxy(result, {
        get: function(result, prop) {
          if ( prop in result ) return result[prop];
          else throw new Error(`Address "${prop}" not found`);
        }
      });
    },
  }

  return { addresses, log, logAddress, logRevert };
}

async function timeout (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fromCSV (filename) {
  const file = fs.readFileSync(filename, 'utf-8');
  const lines = file.split(/\r\n|\n/).filter(s => s);
  const entries = lines.map(line => line.split(','));
  const result = {
    addresses: [],
    balances: []
  };
  entries.forEach(([address, balance]) => {
    result.addresses.push(address.trim());
    result.balances.push(balance.trim());
  });
  return result;
}

function fromCSVToRows (filename) {
  const file = fs.readFileSync(filename, 'utf-8');
  const lines = file.split(/\r\n|\n/).filter(s => s);
  const entries = lines.map(line => line.split(','));
  const result = {
    addresses: [],
    balances: []
  };
  entries.forEach(([address, balance]) => {
    result.addresses.push(address);
    result.balances.push(balance);
  });
  return result;
}

function splitCSV (filename, name) {
  const file = fs.readFileSync(filename, 'utf-8');
  const lines = file.split(/\r\n|\n/).filter(s => s);
  lines.forEach((line, idx) => fs.appendFileSync(`${name}_${idx}.csv`, line));
}

module.exports = { fromCSV, logger, timeout };

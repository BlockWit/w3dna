const { execSync } = require('child_process')
const { logger } = require('../util');

function deploy() {

const args = process.argv.slice(2);
const network = args[args.findIndex(argName => argName === '--network') + 1];
const { addresses } = logger(network);

const contracts = addresses.claim([
  'PaymentReceiver',
])

for (const [name, address] of Object.entries(contracts)) {
  execSync(`npx truffle run verify ${name}@${address} --network ${network}`, {stdio: 'inherit'});
}

}

module.exports = function main (callback) {
  try {
    deploy();
    console.log('success');
    callback(null);
  } catch (e) {
    console.log('error');
    console.log(e);
    callback(e);
  }
};

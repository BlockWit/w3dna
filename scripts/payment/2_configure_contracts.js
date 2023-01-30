const PaymentReceiver = artifacts.require('PaymentReceiver');
const { logger } = require('../util');


async function deploy () {
  const { addresses, log } = logger(config.network);
  const {
    PaymentReceiver: PAYMENT_RECEIVER_ADDRESS,
    USDC: USDC_ADDRESS,
  } = addresses.claim([
    'PaymentReceiver',
    'USDC'
  ]);
  const [ deployer ] = await web3.eth.getAccounts();
  const paymentReceiver = await PaymentReceiver.at(PAYMENT_RECEIVER_ADDRESS);

  {
    log(`PaymentReceiver. Add USDC asset.`);
    const tx = await paymentReceiver.setAsset(USDC_ADDRESS, 'USDC', 1, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }

}

module.exports = async function main (callback) {
  try {
    await deploy();
    console.log('success');
    callback(null);
  } catch (e) {
    console.log('error');
    console.log(e);
    callback(e);
  }
};

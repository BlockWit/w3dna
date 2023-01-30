const BNSDomainNameMarket = artifacts.require('BNSDomainNameMarket');
const BNSNFT = artifacts.require('BNSNFT');
const BNSContentRouter = artifacts.require('BNSContentRouter');
const BNSSimpleContentProvider = artifacts.require('BNSSimpleContentProvider');
const BNSContentProvider = artifacts.require('BNSContentProvider');
const { logger } = require('../util');

async function deploy () {
  const { addresses, log } = logger(config.network);
  const {
    BNSNFT: NFT_ADDRESS,
    BNSDomainNameMarket: MARKET_ADDRESS,
    BNSContentRouter: ROUTER_ADDRESS,
    BNSSimpleContentProvider: PROVIDER_ADDRESS,
    BNSContentProvider: PROVIDER1_ADDRESS,
    DividendManager: DIVIDENDS_ADDRESS,
    BUSD: BUSD_ADDRESS,
    USDT: USDT_ADDRESS,
  } = addresses.claim([
    'BNSNFT',
    'BNSDomainNameMarket',
    'BNSContentRouter',
    'BNSSimpleContentProvider',
    'BNSContentProvider',
    'DividendManager',
    'BUSD',
    'USDT'
  ])
  const [deployer] = await web3.eth.getAccounts();

  const nft = await BNSNFT.at(NFT_ADDRESS);
  const market = await BNSDomainNameMarket.at(MARKET_ADDRESS);
  const contentRouter = await BNSContentRouter.at(ROUTER_ADDRESS);
  const contentProvider = await BNSSimpleContentProvider.at(PROVIDER_ADDRESS);
  const contentProvider1 = await BNSContentProvider.at(PROVIDER1_ADDRESS);

  {
    log(`NFT. Grant minter role to Market.`);
    const tx = await nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`NFT. Set content router.`);
    const tx = await nft.setContentRouter(ROUTER_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`ContentRouter. Grant content manager role to NFT.`);
    const tx = await contentRouter.grantRole(web3.utils.keccak256('CONTENT_MANAGER'), nft.address, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`ContentRouter. Set content provider.`);
    const tx = await contentRouter.setDefaultContentProvider(PROVIDER_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`ContentProvider. Grant content manager role to ContentRouter.`);
    const tx = await contentProvider.grantRole(web3.utils.keccak256('CONTENT_MANAGER'), contentRouter.address, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Market. Set NFT.`);
    const tx = await market.setBNSNFT(NFT_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Market. Set BUSD.`);
    const tx = await market.setAsset(BUSD_ADDRESS, 'BUSD', 1, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Market. Set USDT.`);
    const tx = await market.setAsset(USDT_ADDRESS, 'USDT', 1, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Market. Set fundraising wallet.`);
    const tx = await market.setDividendManager(DIVIDENDS_ADDRESS, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`ContentProvider1. Grant content manager role to ContentRouter.`);
    const tx = await contentProvider1.grantRole(web3.utils.keccak256('ADMIN'), contentRouter.address, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Provider1. Set NFT.`);
    const tx = await contentProvider1.setNFT(NFT_ADDRESS, {from: deployer});
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

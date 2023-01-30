const InvestNFTMarket = artifacts.require('InvestNFTMarket');
const InvestNFTMarketPricePolicy = artifacts.require('InvestNFTMarketPricePolicy');
const InvestNFT = artifacts.require('InvestNFT');
const DividendManager = artifacts.require('DividendManager');
const { logger } = require('../util');

async function deploy () {
  const { log, logAddress } = logger(config.network);
  const [deployer] = await web3.eth.getAccounts();

  const market = await InvestNFTMarket.new({ from: deployer });
  log(`InvestNFTMarket deployed: @address{${market.address}}`);
  logAddress('InvestNFTMarket', market.address);

  const pricing = await InvestNFTMarketPricePolicy.new({ from: deployer });
  log(`InvestNFTMarketPricePolicy deployed: @address{${pricing.address}}`);
  logAddress('InvestNFTMarketPricePolicy', pricing.address);

  const nft = await InvestNFT.new({ from: deployer });
  log(`InvestNFT deployed: @address{${nft.address}}`);
  logAddress('InvestNFT', nft.address)

  const dividends = await DividendManager.new({ from: deployer });
  log(`DividendManager deployed: @address{${dividends.address}}`);
  logAddress('DividendManager', dividends.address);

  const contracts = [
    { contract: market, name: 'InvestNFTMarket' },
    { contract: pricing, name: 'InvestNFTMarketPricePolicy' },
    { contract: nft, name: 'InvestNFT' },
    { contract: dividends, name: 'DividendManager' }
  ]

  log(Object.entries({ market, pricing, nft, dividends }).reduce((result, [key, contract]) => {
    return `${result} --${key} ${contract.address}`
  }, 'Configuration params:'));

  log(contracts.reduce((result, { contract, name }) => {
    return `${result} ${name}@${contract.address}`
  }, 'Verification params: npx truffle run verify'));

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

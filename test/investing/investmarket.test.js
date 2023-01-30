const {accounts, contract, web3} = require('@openzeppelin/test-environment');
const {BN, expectRevert, ether} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {getEvents} = require("../util");

const InvestNFT = contract.fromArtifact('InvestNFT');
const InvestNFTMarket = contract.fromArtifact('InvestNFTMarket');
const InvestNFTMarketPricePolicy = contract.fromArtifact('InvestNFTMarketPricePolicy');
const DividendManager = contract.fromArtifact('DividendManager');
const ERC20Mock = contract.fromArtifact('ERC20Mock');

const [ deployer, account1, account2 ] = accounts;
const PRICE = ether('0.000000000000000001');

describe('InvestMarket', async () => {
  let dividendManager;
  let market
  let pricing
  let nft;
  let usdt;

  beforeEach(async function () {
    [ nft, dividendManager, market, pricing, usdt ] = await Promise.all([
      InvestNFT.new({ from: deployer }),
      DividendManager.new({ from: deployer }),
      InvestNFTMarket.new({ from: deployer }),
      InvestNFTMarketPricePolicy.new({ from: deployer }),
      ERC20Mock.new('USDT Pegged Token', 'USDT', account1, ether('2000000'), { from: deployer })
    ]);
    await Promise.all([
      nft.setDividendManager(dividendManager.address, { from: deployer }),
      nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, { from: deployer }),
      dividendManager.setDepositary(nft.address, { from: deployer }),
      dividendManager.setAsset(usdt.address, 'USDT', 1, { from: deployer }),
      market.setInvestNFT(nft.address, { from: deployer }),
      market.setPricePolicy(pricing.address, { from: deployer }),
      market.setAsset(usdt.address, 'USDT', 1, { from: deployer }),
      pricing.setPrice(PRICE, { from: deployer })
    ]);
  });

  describe('buyExactShares', function () {
    const share = ether('0.0000000000001');
    beforeEach(async () => {
      await usdt.approve(market.address, PRICE.mul(share), { from: account1 });
    });

    it('should sell exact amount of shares to specified address', async () => {
      await market.buyExactShares(share, usdt.address, { from: account1 });
      expect(await nft.balanceOf(account1)).to.be.bignumber.equal(new BN('1'));
      expect(await nft.shareOf(0)).to.be.bignumber.equal(share);
      expect(await nft.issuedShares()).to.be.bignumber.equal(share);
    });
  });

});

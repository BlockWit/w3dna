const {accounts, contract, web3} = require('@openzeppelin/test-environment');
const {BN, expectRevert, ether, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {getEvents} = require("./util");

const InvestNFT = contract.fromArtifact('InvestNFT');
const InvestNFTMarket = contract.fromArtifact('InvestNFTMarket');
const InvestNFTMarketPricePolicy = contract.fromArtifact('InvestNFTMarketPricePolicy');
const DividendManager = contract.fromArtifact('DividendManager');
const ERC20Mock = contract.fromArtifact('ERC20Mock');
const BNSDomainNameMarket = contract.fromArtifact('BNSDomainNameMarket');
const BNSNFT = contract.fromArtifact('BNSNFT');


const [ deployer, user, holder1, holder2, holder3, seller, referer ] = accounts;
const PRICE = ether('0.000000000000000001');
const domainNames = ['a', 'ab', 'abc', 'abcd', 'abcde'];

describe('Integration test', function () {
  this.timeout(0);
  let dividendManager;
  let market
  let pricing
  let nft;
  let usdt;
  let bnsMarket;
  let bnsNFT;
  const share = ether('0.0000000000001');

  beforeEach(async function () {
    [nft, dividendManager, market, pricing, usdt] = await Promise.all([
      InvestNFT.new({from: deployer}),
      DividendManager.new({from: deployer}),
      InvestNFTMarket.new({from: deployer}),
      InvestNFTMarketPricePolicy.new({from: deployer}),
      ERC20Mock.new('USDT Pegged Token', 'USDT', user, ether('2000000'), {from: deployer}),

    ]);
    await Promise.all([
      nft.setDividendManager(dividendManager.address, {from: deployer}),
      nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, {from: deployer}),
      dividendManager.setDepositary(nft.address, {from: deployer}),
      dividendManager.setAsset(usdt.address, 'USDT', 1, {from: deployer}),
      market.setInvestNFT(nft.address, {from: deployer}),
      market.setPricePolicy(pricing.address, {from: deployer}),
      market.setAsset(usdt.address, 'USDT', 1, {from: deployer}),
      pricing.setPrice(PRICE, {from: deployer}),
    ])
    {
      const [market, nft] = await Promise.all([
        BNSDomainNameMarket.new({from: deployer}),
        BNSNFT.new({from: deployer})
      ]);
      bnsMarket = market;
      bnsNFT = nft;
      await Promise.all([
        await market.setBNSNFT(nft.address, {from: deployer}),
        await market.setDividendManager(dividendManager.address, {from: deployer}),
        await market.setAsset(usdt.address, 'USDT', 1, {from: deployer}),
        await nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, {from: deployer}),
        await market.grantRole(web3.utils.keccak256('MINTER_ROLE'), seller, {from: deployer}),
      ])
    }
  });

  describe('BNSDOMainNameMarket', function () {
    const share = ether('0.0000000000001');
    beforeEach(async () => {
      await nft.safeMint(holder1, ether('0.0000000000003'), {from: deployer});
      await nft.safeMint(holder2, ether('0.0000000000003'), {from: deployer});
      await nft.safeMint(holder3, ether('0.0000000000002'), {from: deployer});
      await usdt.approve(market.address, PRICE.mul(share), {from: user});
      await market.buyExactShares(share, usdt.address, {from: user});

    });

    describe('buy and sendDividents', function () {
      it('should transfer all nft to buyer and referer bonus to referer', async function () {
        await usdt.approve(bnsMarket.address, ether('100000'), {from: user});
        expect(await bnsNFT.balanceOf(user)).to.be.bignumber.equal('0');
        await bnsMarket.buy(domainNames, ether('100000'), user, referer, ether('10000'), usdt.address, false, {from: seller});
        expect(await bnsNFT.balanceOf(user)).to.be.bignumber.equal('5');
        expect(await usdt.balanceOf(referer)).to.be.bignumber.equal(ether('10000'));
        expect(await usdt.balanceOf(bnsMarket.address)).to.be.bignumber.equal(ether('90000'));
        await bnsMarket.methods['sendDividends(address)'](usdt.address, {from: deployer});
        expect(await dividendManager.withdrawableDividendOf(0, usdt.address)).to.be.bignumber.equal(ether('30000'));
        expect(await dividendManager.withdrawableDividendOf(1, usdt.address)).to.be.bignumber.equal(ether('30000'));
        expect(await dividendManager.withdrawableDividendOf(2, usdt.address)).to.be.bignumber.equal(ether('20000'));
        expect(await dividendManager.withdrawableDividendOf(3, usdt.address)).to.be.bignumber.equal(ether('10000'));
      });
    });
  });
});
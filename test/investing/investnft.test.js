const {accounts, contract, web3} = require('@openzeppelin/test-environment');
const {BN, expectRevert, ether} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {getEvents} = require("../util");

const InvestNFT = contract.fromArtifact('InvestNFT');
const DividendManager = contract.fromArtifact('DividendManager');
const ERC20Mock = contract.fromArtifact('ERC20Mock');

const [ deployer, account1, account2 ] = accounts;


describe('InvestNFT', async () => {
  let nft;
  let dividendManager;
  let usdt;

  beforeEach(async function () {
    [ nft, dividendManager, usdt ] = await Promise.all([
      InvestNFT.new({ from: deployer }),
      DividendManager.new({ from: deployer }),
      ERC20Mock.new('USDT Pegged Token', 'USDT', deployer, ether('20000'), { from: deployer })
    ]);
    await Promise.all([
      nft.setDividendManager(dividendManager.address, { from: deployer }),
      dividendManager.setDepositary(nft.address, { from: deployer }),
      dividendManager.setAsset(usdt.address, 'USDT', 1, { from: deployer })
    ]);
  });

  describe('safeMint', function () {
    it('should mint token to specified address', async () => {
      const share = '1000';
      await nft.safeMint(account1, share, { from: deployer });
      expect(await nft.balanceOf(account1)).to.be.bignumber.equal(new BN('1'));
      expect(await nft.shareOf(0)).to.be.bignumber.equal(share);
      expect(await nft.issuedShares()).to.be.bignumber.equal(share);
    });
  });

  describe('burn', function () {
    beforeEach(async () => {
      await nft.safeMint(account1, '1000', { from: deployer });
    });

    it('should burn the specified token and share', async () => {
      expect(await nft.balanceOf(account1)).to.be.bignumber.equal(new BN('1'));
      expect(await nft.shareOf(0)).to.be.bignumber.equal(new BN('1000'));
      await nft.burn(0, { from: account1 });
      expect(await nft.balanceOf(account1)).to.be.bignumber.equal(new BN('0'));
      expect(await nft.shareOf(0)).to.be.bignumber.equal(new BN('0'));
      expect(await nft.issuedShares()).to.be.bignumber.equal(new BN('0'));
    });
  });

});

const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { balance, BN, constants, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert, expect } = require('chai');
const {getEvents} = require("./util");

const AssetHandlerMock = contract.fromArtifact('AssetHandlerMock');
const ERC20Mock = contract.fromArtifact('ERC20Mock');

const [ owner, user, holder ] = accounts;


describe('AssetHandler', function () {
  let assetHandler;
  let tokens = {
    frst: { contract: undefined,  ticker: 'frst', type: 1},
    scnd: { contract: undefined,  ticker: 'scnd', type: 1 },
    thrd: { contract: undefined,  ticker: 'thrd', type: 1 }
  };

  beforeEach(async function () {
    assetHandler = await AssetHandlerMock.new({ from: owner });
    [ tokens.frst.contract, tokens.scnd.contract, tokens.thrd.contract ] = await Promise.all([
      ERC20Mock.new('First Mock Token', 'FRST', owner, ether('10000'), { from: owner }),
      ERC20Mock.new('Second Mock Token', 'SCND', owner, ether('20000'), { from: owner }),
      ERC20Mock.new('Third Mock token', 'THRD', owner, ether('30000'), { from: owner })
    ])
  });

  describe('setAsset', function () {
    it('should add specified asset at specified index to contract', async function () {
      await assetHandler.setAsset(tokens.frst.contract.address, tokens.frst.ticker, tokens.frst.type, {from: owner});
      const assetFromMap = await assetHandler.getAsset(tokens.frst.contract.address);
      const tempAsset = ['frst', '1'];
      expect(assetFromMap[0]).to.be.equal(tempAsset[0]);
      expect(assetFromMap[1]).to.be.equal(tempAsset[1]);
    });
  });

  describe('removeAsset', function () {
    it('should remove asset at specified index correctly', async function () {
      await assetHandler.setAsset(tokens.frst.contract.address, tokens.frst.ticker, tokens.frst.type, {from: owner});
      const assetFromMap = await assetHandler.getAssetAt(0);
      const { 0: key, 1: array} = { 0: tokens.frst.contract.address, 1: ['frst', '1']};
      expect(assetFromMap[0]).to.be.bignumber.equal(key);
      expect(assetFromMap[1][0]).to.be.equal(array[0]);
      expect(assetFromMap[1][1]).to.be.equal(array[1]);
      await assetHandler.removeAsset(tokens.frst.contract.address, {from : owner});
      await expectRevert(assetHandler.getAsset(tokens.frst.contract.address), 'Assets.Map: nonexistent key');
    });
  });

  describe('transfer', function () {
    it('should work correctly with any of the specified assets', async function () {
      await assetHandler.setAsset(tokens.thrd.contract.address, tokens.thrd.ticker, tokens.thrd.type, {from: owner});
      const assetFromMap = await assetHandler.getAsset(tokens.thrd.contract.address);
      const tempAsset = ['thrd', '1'];
      expect(assetFromMap[0]).to.be.equal(tempAsset[0]);
      expect(assetFromMap[1]).to.be.equal(tempAsset[1]);
      await tokens.thrd.contract.transfer(assetHandler.address, ether('2000'), { from: owner });
      expect(await tokens.thrd.contract.balanceOf(assetHandler.address)).to.be.bignumber.equal(ether('2000'));
      const { tx } = await assetHandler.transfer(user, ether('1000'), tokens.thrd.contract.address, {from: owner});
      const [{ args: { from, to, value }}] = await getEvents(tx, tokens.thrd.contract, 'Transfer', web3);
      expect(from).to.be.equal(assetHandler.address);
      expect(to).to.be.equal(user);
      expect(value).to.be.bignumber.equal(ether('1000'));
    });
  });

  describe('transferFrom', function () {
    it('should work correctly with any of the specified assets', async function () {
      await assetHandler.setAsset(tokens.scnd.contract.address, tokens.scnd.ticker, tokens.scnd.type, {from: owner});
      const assetFromMap = await assetHandler.getAsset(tokens.scnd.contract.address);
      const tempAsset = ['scnd', '1'];
      expect(assetFromMap[0]).to.be.equal(tempAsset[0]);
      expect(assetFromMap[1]).to.be.equal(tempAsset[1]);
      await tokens.scnd.contract.transfer(holder, ether('2000'), { from: owner });
      expect(await tokens.scnd.contract.balanceOf(holder)).to.be.bignumber.equal(ether('2000'));
      await tokens.scnd.contract.approve(assetHandler.address, ether('2000'), { from: holder });
      const { tx } = await assetHandler.transferFrom(holder, user, ether('1000'), tokens.scnd.contract.address, {from: owner});
      const [{ args: { from, to, value }}] = await getEvents(tx, tokens.scnd.contract, 'Transfer', web3);
      expect(from).to.be.equal(holder);
      expect(to).to.be.equal(user);
      expect(value).to.be.bignumber.equal(ether('1000'));
    });
  });

  describe('assetsLength', function () {
    it('should return amount of assets', async function () {
      await assetHandler.setAsset(tokens.frst.contract.address, tokens.frst.ticker, tokens.frst.type, {from: owner});
      await assetHandler.setAsset(tokens.scnd.contract.address, tokens.scnd.ticker, tokens.scnd.type, {from: owner});
      await assetHandler.setAsset(tokens.thrd.contract.address, tokens.thrd.ticker, tokens.thrd.type, {from: owner});
      expect(await assetHandler.assetsLength()).to.be.bignumber.equal('3');
    });
  });
});

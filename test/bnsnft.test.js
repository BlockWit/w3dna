const {accounts, contract, web3} = require('@openzeppelin/test-environment');
const {BN, expectRevert, ether} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {getEvents} = require("./util");

const BNSNFT = contract.fromArtifact('BNSNFT');

const [account1, account2, owner] = accounts;

const DOMAINS_TO_DATA = [
  {
    domain: "blockwit",
    address: new BN(0),
    content: "Some content of blockwit site"
  },
  {
    domain: "mysite",
    address: new BN(0),
    content: "Some content of mysyte"
  }
];
const domainNames = ['blockwit', 'mysite', 'lol'];
const domainNames1 = ['blockwit', 'mysite', 'lol', 'blockwit'];

const ONE_DAY = new BN(1);

describe('BNSNFT', async () => {
  let bnsnft;

  beforeEach(async function () {
    bnsnft = await BNSNFT.new({ from: owner });
  });

  describe('unsafeBatchMint', function () {
    context('when called by admin', function () {
      it('should add domains in array to specified address', async function () {
        expect(await bnsnft.balanceOf(account1, { from: account1})).to.be.bignumber.equal('0');
        await bnsnft.unsafeBatchMint(account1, domainNames, { from: owner});
        expect(await bnsnft.balanceOf(account1, { from: account1})).to.be.bignumber.equal('3');
      });
    });
    context('when called not by admin', function () {
      it('revert', async function () {
        await expectRevert.unspecified(bnsnft.unsafeBatchMint(account1, domainNames, { from: account1}));
      });
    });
  });

  describe('safeBatchMint', function () {
    context('when called by admin', function () {
      it('should mint domains to specified address', async function () {
        expect(await bnsnft.balanceOf(account2, { from: account2})).to.be.bignumber.equal('0');
        await bnsnft.safeBatchMint(account2, domainNames, { from: owner});
        expect(await bnsnft.balanceOf(account2, { from: account2})).to.be.bignumber.equal('3');
      });
      it('shouldn`t mint duplicate domains to specified address', async function () {
        expect(await bnsnft.balanceOf(account2, { from: account2})).to.be.bignumber.equal('0');
        await expectRevert.unspecified(bnsnft.safeBatchMint(account2, domainNames1, { from: owner}));
      });
    });
    context('when called not by admin', function () {
      it('revert', async function () {
        await expectRevert.unspecified(bnsnft.safeBatchMint(account1, domainNames, { from: account1}));
      });
    });
  });

});

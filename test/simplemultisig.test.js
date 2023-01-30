const {accounts, contract, web3} = require('@openzeppelin/test-environment');
const {balance, BN, constants, ether, expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers');
const {assert, expect} = require('chai');
const {getEvents} = require("./util");

const Multisig = contract.fromArtifact('SimpleMultiSig');
const ERC20Mock = contract.fromArtifact('ERC20Mock');

const [owner, account1, account2, receiver] = accounts;

const owners = [owner, account1, account2]


describe('SimpleMultiSig', function () {
    this.timeout(0);
    let multisig;
    let token;

    beforeEach(async function () {
        multisig = await Multisig.new({from: owner});
        token = await ERC20Mock.new('BUSD Mock Token', 'BUSD', owner, ether('100000000'), {from: owner});
        await token.transfer(account1, ether('5000000'), {from: owner});
        await token.transfer(account2, ether('5000000'), {from: owner});
        await token.transfer(multisig.address, ether('5000000'), {from: owner});
    });

    describe('initialize', function () {
        it('should work', async function () {
            expect(await multisig.initialized()).to.be.equal(false);
            await multisig.initialize(owners, 3, {from: owner});
            expect(await multisig.initialized()).to.be.equal(true);
        });
    });

    describe('createWithdrawTransaction', function () {
        it('should work', async function () {
            await multisig.initialize(owners, 3, {from: owner});
            await multisig.createWithdrawTransaction(token.address, receiver, 1000, {from: owner});
            expect(await multisig.txsCounter()).to.be.bignumber.equal('1');
        });
    });

    describe('approveWithdrawTransaction', function () {
        it('should work', async function () {
            await multisig.initialize(owners, 3, {from: owner});
            await multisig.createWithdrawTransaction(token.address, receiver, 1000, {from: owner});
            await multisig.approveWithdrawTransaction(0, {from: account1});
            await multisig.approveWithdrawTransaction(0, {from: account2});
            expect(await token.balanceOf(receiver)).to.be.bignumber.equal("1000");
        });
    });
});
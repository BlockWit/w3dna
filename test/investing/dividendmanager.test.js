const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { balance, BN, constants, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert, expect } = require('chai');
const { getEvents } = require('../util');

const DividendManager = contract.fromArtifact('DividendManager');
const InvestNFT = contract.fromArtifact('InvestNFT');
const ERC20Mock = contract.fromArtifact('ERC20Mock');

const [ owner, account1, account2 ] = accounts;

describe('DividendManager', function () {
    this.timeout(0);
    let dividendManager;
    let investnft;
    let token;

    beforeEach(async function () {
        dividendManager = await DividendManager.new({from: owner});
        investnft = await InvestNFT.new({from: owner});
        token = await ERC20Mock.new('BUSD Mock Token', 'BUSD', owner, ether('100000000'), { from: owner });
        await token.transfer(account1, ether('5000000'), { from: owner});
        await token.transfer(account2, ether('5000000'), { from: owner});
    });


    describe('setDepositary', function () {
        context('when called by admin', function () {
            it('should change depositary', async function () {
                await dividendManager.setDepositary(investnft.address, {from: owner});
                expect(await dividendManager.depositary()).to.be.equal(investnft.address);
            });
        });
        context('when called not by admin', function () {
            it('revert', async function () {
                await expectRevert.unspecified(dividendManager.setDepositary(investnft.address, {from : account1}));
            });
        });
    });

    describe('setAsset', function () {
        context('when called by admin', function () {
            it('should set asset', async function () {
                await dividendManager.setAsset(token.address, 'busd', 1, {from: owner});
                const assetFromMap = await dividendManager.getAsset(token.address);
                const tempAsset = ['busd', '1'];
                expect(assetFromMap[0]).to.be.equal(tempAsset[0]);
                expect(assetFromMap[1]).to.be.equal(tempAsset[1]);
            });
        });
        context('when called not by admin', function () {
            it('revert', async function () {
                await expectRevert.unspecified(dividendManager.setAsset(token.address, 'busd', 1, {from: account1}));
            });
        });
    });

    describe('removeAsset', function () {
        context('when called by admin', function () {
            it('should set asset', async function () {
                await dividendManager.setAsset(token.address, 'busd', 1, {from: owner});
                await dividendManager.removeAsset(token.address, {from : owner});
                await expectRevert(dividendManager.getAsset(token.address), 'Assets.Map: nonexistent key');
            });
        });
        context('when called not by admin', function () {
            it('revert', async function () {
                await dividendManager.setAsset(token.address, 'busd', 1, {from: owner});
                await expectRevert.unspecified(dividendManager.removeAsset(token.address, {from: account1}));
            });
        });
    });

    describe('withdrawDividend', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                investnft.safeMint(account1, 1000, {from: owner})
            ])
        });
        it('should work correctly', async function () {
            await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
            const { tx } = await dividendManager.withdrawDividend(0);
            const [{ args: { from, to, value }}] = await getEvents(tx, token, 'Transfer', web3);
            expect(from).to.be.equal(dividendManager.address);
            expect(to).to.be.equal(account1);
            expect(value).to.be.bignumber.equal(ether('10000'));
        });
    });

    describe('withdrawableDividendOf', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                investnft.safeMint(account1, 1000, {from: owner})
            ])
        });
        it('should return withdrawable dividends', async function () {
            await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
            const dividends = await dividendManager.methods['withdrawableDividendOf(uint256)'](0);
            const { 0: assetKey, 1: assetTicker, 2: amount} = {0: token.address, 1: 'busd', 2: ether('10000')};
            expect(assetKey).to.be.equal(dividends[0][0]);
            expect(assetTicker).to.be.equal(dividends[0][1]);
            expect(amount).to.be.bignumber.equal(dividends[0][2]);
        });
    });

    describe('withdrawnDividendOf', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                investnft.safeMint(account1, 1000, {from: owner})
            ])
        });
        it('should return withdrawn dividends', async function () {
            await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
            await dividendManager.withdrawDividend(0, token.address);
            const dividends = await dividendManager.methods['withdrawnDividendOf(uint256)'](0);
            const { 0: assetKey, 1: assetTicker, 2: amount} = {0: token.address, 1: 'busd', 2: ether('10000')};
            expect(assetKey).to.be.equal(dividends[0][0]);
            expect(assetTicker).to.be.equal(dividends[0][1]);
            expect(amount).to.be.bignumber.equal(dividends[0][2]);
        });
    });

    describe('accumulativeDividendOf', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                investnft.safeMint(account1, 1000, {from: owner})
            ])
        });
        it('should return accumulative dividends', async function () {
            await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
            const dividends = await dividendManager.methods['accumulativeDividendOf(uint256)'](0);
            const { 0: assetKey, 1: assetTicker, 2: amount} = {0: token.address, 1: 'busd', 2: ether('10000')};
            expect(assetKey).to.be.equal(dividends[0][0]);
            expect(assetTicker).to.be.equal(dividends[0][1]);
            expect(amount).to.be.bignumber.equal(dividends[0][2]);
        });
    });

    describe('distributeDividends', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1})
            ])
        });
        context('should work as intended', function () {
            it('transfer amount and change magnifiedDividendPerShare', async function () {
                await investnft.safeMint(account1, 1000, {from: owner});
                const { tx } = await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
                const [{ args: { from, to, value }}] = await getEvents(tx, token, 'Transfer', web3);
                expect(from).to.be.equal(account1);
                expect(to).to.be.equal(dividendManager.address);
                expect(value).to.be.bignumber.equal(ether('10000'));
            });
        });
        context('if no one has a share', function () {
            it('revert', async function () {
                await expectRevert(dividendManager.distributeDividends(1000, token.address),
                    "DividendManager: the number of shares that receive dividends must be greater than 0")
            });
        });
        context('if amount == 0', function () {
            it('revert', async function () {
                await investnft.safeMint(account1, 1000, {from: owner});
                await expectRevert(dividendManager.distributeDividends(0, token.address),
                    "DividendManager: amount must be greater than 0")
            });
        });
    });

    describe('includeInDividends', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                token.approve(dividendManager.address, ether('10000'), {from: account2}),
                investnft.safeMint(account1, 1000, {from: owner}),
                investnft.safeMint(account2, 1000, {from: owner}),
                dividendManager.grantRole(web3.utils.keccak256('DEPOSITARY_ROLE'), owner, { from: owner })
            ])
        });
        context('if account excluded', function () {
            it('should set asset', async function () {
                await dividendManager.excludeFromDividends(0, {from: owner});
                await dividendManager.includeInDividends(0, {from: owner});
            });
        });
        context('if account not excluded', function () {
            it('revert', async function () {
                await expectRevert(dividendManager.includeInDividends(0, {from: owner}),
                    'DivManager: the specified account is not excluded from dividends');
            });
        });
    });

    describe('excludeFromDividends', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                token.approve(dividendManager.address, ether('10000'), {from: account2}),
                investnft.safeMint(account1, 1000, {from: owner}),
                investnft.safeMint(account2, 1000, {from: owner}),
                dividendManager.grantRole(web3.utils.keccak256('DEPOSITARY_ROLE'), owner, { from: owner })
            ])
        });
        context('if account already excluded', function () {
            it('revert', async function () {
                await dividendManager.excludeFromDividends(0, {from: owner});
                await expectRevert(dividendManager.excludeFromDividends(0, {from: owner}),
                    'DivManager: the specified account is already excluded from dividends');
            });
        });
        context('if account not excluded', function () {
            it('should set asset', async function () {
                await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
                const before1 = await dividendManager.withdrawableDividendOf(0, token.address);
                const before2 = await dividendManager.withdrawableDividendOf(1, token.address);
                expect(before1).to.be.bignumber.equal(ether('5000'));
                expect(before2).to.be.bignumber.equal(ether('5000'));
                await dividendManager.excludeFromDividends(0, {from: owner});
                await dividendManager.distributeDividends(ether('10000'), token.address, {from: account2});
                const after1 = await dividendManager.withdrawableDividendOf(0, token.address);
                const after2 = await dividendManager.withdrawableDividendOf(1, token.address);
                expect(after1).to.be.bignumber.equal(ether('5000'));
                expect(after2).to.be.bignumber.equal(ether('15000'));
            });
        });
    });

    describe('handleMint', function () {
        it('should change magnifiedDividendCorrections', async function () {

        });
    });

    describe('handleBurn', function () {
        it('should change magnifiedDividendCorrections', async function () {

        });
    });

    describe('withdrawDividend', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                investnft.safeMint(account1, 1000, {from: owner})
            ])
        });
        context('if withdrawableDividend > 0', function () {
            it('should transfer dividend to specified account', async function () {
                await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
                const { tx } = await dividendManager.withdrawDividend(0, token.address);
                const [{ args: { from, to, value }}] = await getEvents(tx, token, 'Transfer', web3);
                expect(from).to.be.equal(dividendManager.address);
                expect(to).to.be.equal(account1);
                expect(value).to.be.bignumber.equal(ether('10000'));
            });
        });
    });

    describe('withdrawableDividendOf', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                investnft.safeMint(account1, 1000, {from: owner})
            ])
        });
        it('should return withdrawableDividendOf specified account and asset', async function () {
            await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
            const temp = await dividendManager.withdrawableDividendOf(0, token.address);
            expect(temp).to.be.bignumber.equal(ether('10000'));
        });
    });

    describe('withdrawnDividendOf', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                investnft.safeMint(account1, 1000, {from: owner})
            ])
        });
        it('should return withdrawnDividends of specified asset and account', async function () {
            await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
            await dividendManager.withdrawDividend(0, token.address);
            const temp = await dividendManager.withdrawnDividendOf(0, token.address);
            expect(temp).to.be.bignumber.equal(ether('10000'));
        });
    });

    describe('accumulativeDividendOf', function () {
        beforeEach(async function () {
            await Promise.all([
                dividendManager.setDepositary(investnft.address, {from: owner}),
                investnft.setDividendManager(dividendManager.address, {from: owner}),
                dividendManager.setAsset(token.address, 'busd', 1, {from: owner}),
                token.approve(dividendManager.address, ether('10000'), {from: account1}),
                investnft.safeMint(account1, 1000, {from: owner})
            ])
        });
        it('should return accumulativeDividendOf specified account', async function () {
            await dividendManager.distributeDividends(ether('10000'), token.address, {from: account1});
            const temp = await dividendManager.accumulativeDividendOf(0, token.address, {from: account1});
            expect(temp).to.be.bignumber.equal(ether('10000'));
        });
    });
});
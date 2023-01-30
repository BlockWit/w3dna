const {accounts, contract, web3} = require('@openzeppelin/test-environment');
const {balance, BN, constants, ether, expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers');
const {assert, expect} = require('chai');
const {getEvents} = require('./util');

const BNSDomainNameMarket = contract.fromArtifact('BNSDomainNameMarket');
const BNSNFT = contract.fromArtifact('BNSNFT');
const ERC20Mock = contract.fromArtifact('ERC20Mock');
const InvestNFT = contract.fromArtifact('InvestNFT');
const InvestNFTMarket = contract.fromArtifact('InvestNFTMarket');
const InvestNFTMarketPricePolicy = contract.fromArtifact('InvestNFTMarketPricePolicy');
const DividendManager = contract.fromArtifact('DividendManager');

const PRICE = ether('0.000000000000000001');
const domainNames = ["a", "ab", "abc", "abcd", "abcde"];

const [deployer, user, holder1, holder2, holder3, seller, referer] = accounts;

describe('BNSDomainNameMarket', function () {
    this.timeout(0);
    let market;
    let nft;
    let dividend;
    let investnft;
    let investnftmarket;
    let investpricing;
    let tokens = {usdt: {id: 1, contract: undefined, key: 12345}, busd: {id: 2, contract: undefined, key: 23456}};

    beforeEach(async function () {
        [investnft, investnftmarket, investpricing, market, nft, dividend, tokens.busd.contract, tokens.usdt.contract] = await Promise.all([
            InvestNFT.new({from: deployer}),
            InvestNFTMarket.new({from: deployer}),
            InvestNFTMarketPricePolicy.new({from: deployer}),
            BNSDomainNameMarket.new({from: deployer}),
            BNSNFT.new({from: deployer}),
            DividendManager.new({from: deployer}),
            ERC20Mock.new('BUSD Mock Token', 'BUSD', deployer, ether('10000000'), {from: deployer}),
            ERC20Mock.new('USDT Mock Token', 'USDT', deployer, ether('10000000'), {from: deployer}),
        ]);
        await Promise.all([
            tokens.busd.contract.transfer(user, ether('5000000'), {from: deployer}),
            tokens.usdt.contract.transfer(user, ether('5000000'), {from: deployer})
        ])
    });

    describe('setBNSNFT', function () {
        context('when called by admin', function () {
            it('should change bnsnft', async function () {
                await market.setBNSNFT(nft.address, {from: deployer});
                expect(await market.bnsnft()).to.be.equal(nft.address);
            });
        });
        context('when called not by admin', function () {
            it('revert', async function () {
                await expectRevert.unspecified(market.setBNSNFT(nft.address, {from: user}));
            });
        });
    });

    describe('setDividendManager', function () {
        context('when called by admin', function () {
            it('should change address of the dividend manager', async function () {
                await market.setDividendManager(dividend.address, {from: deployer});
                expect(await market.dividendManager()).to.be.equal(dividend.address);
            });
        });
        context('when called not by admin', function () {
            it('revert', async function () {
                await expectRevert.unspecified(market.setDividendManager(dividend.address, {from: user}));
            });
        });
    });

    describe('setAsset', function () {
        context('when called by admin', function () {
            it('should add specified asset to assets.map', async function () {
                await market.setAsset(tokens.usdt.contract.address, 'USDT', 1, {from: deployer});
                const [ticker, type] = await market.getAsset(tokens.usdt.contract.address);
                expect(ticker).to.be.equal('USDT');
                expect(type).to.be.equal('1');
            });
        });
        context('when called not by admin', function () {
            it('revert', async function () {
                await expectRevert.unspecified(market.setAsset(tokens.busd.contract.address, 'BUSD', 1, {from: user}));
            });
        });
    });

    describe('removeAsset', function () {
        context('if asset is added', function () {
            it('should remove specified asset', async function () {
                await market.setAsset(tokens.usdt.contract.address, 'USDT', 1, {from: deployer});
                const [ticker, type] = await market.getAsset(tokens.usdt.contract.address);
                expect(ticker).to.be.equal('USDT');
                expect(type).to.be.equal('1');
                await market.removeAsset(tokens.usdt.contract.address, {from: deployer});
                await expectRevert(market.getAsset(tokens.usdt.contract.address), 'Assets.Map: nonexistent key');
            });
        });
    });

    describe('createCustomMint', function () {
        let dividendManager;
        let market
        let pricing
        let nft;
        let bnsMarket;
        let bnsNFT;
        const share = ether('0.0000000000001');
        let token = {usdt: {id: 1, contract: undefined, key: 12345}};

        beforeEach(async function () {
            [nft, dividendManager, market, pricing, token.usdt.contract] = await Promise.all([
                InvestNFT.new({from: deployer}),
                DividendManager.new({from: deployer}),
                InvestNFTMarket.new({from: deployer}),
                InvestNFTMarketPricePolicy.new({from: deployer}),
                ERC20Mock.new('USDT Pegged Token', 'USDT', deployer, ether('2000000'), {from: deployer}),

            ]);
            await Promise.all([
                nft.setDividendManager(dividendManager.address, {from: deployer}),
                nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, {from: deployer}),
                dividendManager.setDepositary(nft.address, {from: deployer}),
                dividendManager.setAsset(token.usdt.contract.address, 'USDT', 1, {from: deployer}),
                market.setInvestNFT(nft.address, {from: deployer}),
                market.setPricePolicy(pricing.address, {from: deployer}),
                market.setAsset(token.usdt.contract.address, 'USDT', 1, {from: deployer}),
                pricing.setPrice(PRICE, {from: deployer}),
                nft.safeMint(holder1, ether('0.0000000000001'), {from: deployer}),
            ])
            {
                const [market, nft] = await Promise.all([
                    BNSDomainNameMarket.new({from: deployer}),
                    BNSNFT.new({from: deployer})
                ]);
                bnsMarket = market;
                bnsNFT = nft;
                await Promise.all([
                    market.setBNSNFT(nft.address, {from: deployer}),
                    market.setDividendManager(dividendManager.address, {from: deployer}),
                    market.setAsset(token.usdt.contract.address, 'USDT', 1, {from: deployer}),
                    nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, {from: deployer}),
                    market.grantRole(web3.utils.keccak256('MINTER_ROLE'), seller, {from: deployer}),
                    token.usdt.contract.transfer(market.address, ether('500000'), {from: deployer}),
                ])
            }
        });

        it('should add struct to mapping', async function () {
            await bnsMarket.createCustomMint(user, domainNames, {from: deployer});

            await bnsMarket.performCustomMint([domainNames[0]], {from: user});
            expect(await bnsNFT.balanceOf(user)).to.be.bignumber.equal("1");

            await bnsMarket.performCustomMint([domainNames[1]], {from: user});
            expect(await bnsNFT.balanceOf(user)).to.be.bignumber.equal("2");

            await bnsMarket.performCustomMint([domainNames[2]], {from: user});
            expect(await bnsNFT.balanceOf(user)).to.be.bignumber.equal("3");
        });
    });

    describe('sendDividends(assetKey, amount)', function () {
        let dividendManager;
        let market
        let pricing
        let nft;
        let bnsMarket;
        let bnsNFT;
        const share = ether('0.0000000000001');
        let token = {usdt: {id: 1, contract: undefined, key: 12345}};

        beforeEach(async function () {
            [nft, dividendManager, market, pricing, token.usdt.contract] = await Promise.all([
                InvestNFT.new({from: deployer}),
                DividendManager.new({from: deployer}),
                InvestNFTMarket.new({from: deployer}),
                InvestNFTMarketPricePolicy.new({from: deployer}),
                ERC20Mock.new('USDT Pegged Token', 'USDT', deployer, ether('2000000'), {from: deployer}),

            ]);
            await Promise.all([
                nft.setDividendManager(dividendManager.address, {from: deployer}),
                nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, {from: deployer}),
                dividendManager.setDepositary(nft.address, {from: deployer}),
                dividendManager.setAsset(token.usdt.contract.address, 'USDT', 1, {from: deployer}),
                market.setInvestNFT(nft.address, {from: deployer}),
                market.setPricePolicy(pricing.address, {from: deployer}),
                market.setAsset(token.usdt.contract.address, 'USDT', 1, {from: deployer}),
                pricing.setPrice(PRICE, {from: deployer}),
                nft.safeMint(holder1, ether('0.0000000000001'), {from: deployer}),
            ])
            {
                const [market, nft] = await Promise.all([
                    BNSDomainNameMarket.new({from: deployer}),
                    BNSNFT.new({from: deployer})
                ]);
                bnsMarket = market;
                bnsNFT = nft;
                await Promise.all([
                    market.setBNSNFT(nft.address, {from: deployer}),
                    market.setDividendManager(dividendManager.address, {from: deployer}),
                    market.setAsset(token.usdt.contract.address, 'USDT', 1, {from: deployer}),
                    nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, {from: deployer}),
                    market.grantRole(web3.utils.keccak256('MINTER_ROLE'), seller, {from: deployer}),
                    token.usdt.contract.transfer(market.address, ether('500000'), {from: deployer}),
                ])
            }
        });
        it('should distribute dividends', async function () {
            await bnsMarket.createCustomMint(user, domainNames, {from: deployer});
            await bnsMarket.sendDividends(token.usdt.contract.address, ether('400000'), {from: deployer});
            expect(await dividendManager.withdrawableDividendOf(0, token.usdt.contract.address)).to.be.bignumber.equal(ether('400000'));
        });
    });

    describe('sendDividends(assetKey)', function () {
        let dividendManager;
        let market
        let pricing
        let nft;
        let bnsMarket;
        let bnsNFT;
        const share = ether('0.0000000000001');
        let token = {usdt: {id: 1, contract: undefined, key: 12345}};

        beforeEach(async function () {
            [nft, dividendManager, market, pricing, token.usdt.contract] = await Promise.all([
                InvestNFT.new({from: deployer}),
                DividendManager.new({from: deployer}),
                InvestNFTMarket.new({from: deployer}),
                InvestNFTMarketPricePolicy.new({from: deployer}),
                ERC20Mock.new('USDT Pegged Token', 'USDT', deployer, ether('2000000'), {from: deployer}),

            ]);
            await Promise.all([
                nft.setDividendManager(dividendManager.address, {from: deployer}),
                nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, {from: deployer}),
                dividendManager.setDepositary(nft.address, {from: deployer}),
                dividendManager.setAsset(token.usdt.contract.address, 'USDT', 1, {from: deployer}),
                market.setInvestNFT(nft.address, {from: deployer}),
                market.setPricePolicy(pricing.address, {from: deployer}),
                market.setAsset(token.usdt.contract.address, 'USDT', 1, {from: deployer}),
                pricing.setPrice(PRICE, {from: deployer}),
                nft.safeMint(holder1, ether('0.0000000000001'), {from: deployer}),
            ])
            {
                const [market, nft] = await Promise.all([
                    BNSDomainNameMarket.new({from: deployer}),
                    BNSNFT.new({from: deployer})
                ]);
                bnsMarket = market;
                bnsNFT = nft;
                await Promise.all([
                    market.setBNSNFT(nft.address, {from: deployer}),
                    market.setDividendManager(dividendManager.address, {from: deployer}),
                    market.setAsset(token.usdt.contract.address, 'USDT', 1, {from: deployer}),
                    nft.grantRole(web3.utils.keccak256('MINTER_ROLE'), market.address, {from: deployer}),
                    market.grantRole(web3.utils.keccak256('MINTER_ROLE'), seller, {from: deployer}),
                    token.usdt.contract.transfer(market.address, ether('500000'), {from: deployer}),
                ])
            }
        });
        it('should distribute dividends', async function () {
            await bnsMarket.methods['sendDividends(address)'](token.usdt.contract.address, {from: deployer});
            expect(await dividendManager.withdrawableDividendOf(0, token.usdt.contract.address)).to.be.bignumber.equal(ether('500000'));
        });
    });
})
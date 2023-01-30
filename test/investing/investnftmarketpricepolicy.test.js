const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { balance, BN, constants, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert, expect } = require('chai');
const { getEvents } = require("../util");

const InvestNFTMarketPricePolicy = contract.fromArtifact('InvestNFTMarketPricePolicy');
const ERC20Mock = contract.fromArtifact('ERC20Mock');

const [ owner, user, holder ] = accounts;

describe('InvestNFTMarketPricePolicy', function () {
    let invest;
    let token;

    beforeEach(async function () {
        invest = await InvestNFTMarketPricePolicy.new({ from: owner });
        token = await ERC20Mock.new('First Mock Token', 'FRST', owner, ether('10000'), { from: owner });

    });

    describe('getPrice', function () {
        it('should return price', async function () {
            expect(await invest.getPrice(1, token.address)).to.be.bignumber.equal('0');
            await invest.setPrice(10000, {from: owner});
            expect(await invest.getPrice(1, token.address)).to.be.bignumber.equal('10000');
        });
    });

    describe('getTokensForSpecifiedAmount', function () {
        it('should return amount/price', async function () {
            await invest.setPrice(10, {from: owner});
            expect(await invest.getTokensForSpecifiedAmount(100, token.address)).to.be.bignumber.equal('10');
        });
    });

    describe('setPrice', function () {
        context('when called by owner', function () {
            it('should change price', async function () {
                await invest.setPrice(10000, {from: owner});
                expect(await invest.getPrice(1, token.address)).to.be.bignumber.equal('10000');
            });
        });
        context('when called not by owner', function () {
            it('revert', async function () {
                await expectRevert(invest.setPrice(10000, {from: user}),
                    "Ownable: caller is not the owner")
            });
        });
    });

    describe('retrieveTokens', function () {
        context('when called by owner', function () {
            it('should transfer tokens to specified address', async function () {
                await token.transfer(invest.address, ether('2000'), { from: owner });
                expect(await token.balanceOf(invest.address)).to.be.bignumber.equal(ether('2000'));
                await invest.retrieveTokens(user, token.address, { from: owner });
                expect(await token.balanceOf(user)).to.be.bignumber.equal(ether('2000'));
            });
        });
        context('when called not by owner', function () {
            it('revert', async function () {
                await expectRevert(invest.retrieveTokens(user, token.address, {from: user}),
                    "Ownable: caller is not the owner")
            });
        });
    });

    describe('retrieveETH', function () {
        context('when called not by owner', function () {
            it('revert', async function () {
                await expectRevert(invest.retrieveETH(user, {from: user}),
                    "Ownable: caller is not the owner")
            });
        });
    });
});

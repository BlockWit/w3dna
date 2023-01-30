const { contract, web3 } = require('@openzeppelin/test-environment');
const { BN, balance, constants, ether, expectEvent, expectRevert, send } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');

const ERC20Mock = contract.fromArtifact('ERC20Mock');

function shouldBehaveLikeRecoverableFunds (testedContractOwner, poorFellow, anotherUser) {
  
  describe('RecoverableFunds', function () {
    let mockToken;
    let value = ether('123');
    
    describe('retrieveTokens', function () {
      beforeEach(async function() {
        mockToken = await ERC20Mock.new('MockToken', 'MCK', poorFellow, ether('1000'), {from: poorFellow});
        await mockToken.transfer(this.testedContract.address, value, {from: poorFellow})
      })
      
      it('should allow to retrieve tokens sent by mistake', async function () {
        expectEvent(await this.testedContract.retrieveTokens(poorFellow, mockToken.address, {from: testedContractOwner}), 'Transfer', {
          from: this.testedContract.address,
          to: poorFellow,
          value,
        });
      });
      it('should not allow non-owners to call retrieveTokens method', async function () {
        await expectRevert(this.testedContract.retrieveTokens(poorFellow, mockToken.address, {from: anotherUser}), "Ownable: caller is not the owner");
      });
    });
  });
  
}

module.exports = {
  shouldBehaveLikeRecoverableFunds,
};

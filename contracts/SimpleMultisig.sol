// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleMultiSig {

    address constant public ZERO_ADDR = 0x0000000000000000000000000000000000000000;

    bool public initialized;

    mapping(address => bool) public owners;

    uint256 public ownersCount;

    uint8 public approveLimit;

    struct WithdrawTx {
        bool active;
        mapping(address => bool) approved;
        uint8 approvedCounter;
        address assetAddress;
        address receiverAddress;
        uint256 amount;
    }

    mapping(uint256 => WithdrawTx) public withdrawTxs;

    uint256 public txsCounter;

    modifier onlyOwner() {
        require(owners[msg.sender], "Must be in owners list");
        _;
    }

    function initialize(address[] memory addresses, uint8 newApproveLimit) public {
        require(!initialized, "Already initilized");
        for (uint8 i = 0; i < addresses.length; i++) {
            require(!owners[addresses[i]], "Owner address already added");
            owners[addresses[i]] = true;
        }
        ownersCount = addresses.length;
        approveLimit = newApproveLimit;
        initialized = true;
    }

    function createWithdrawTransaction(address assetAddress, address receiverAddress, uint256 amount) public onlyOwner() {
        WithdrawTx storage withdrawTx = withdrawTxs[txsCounter];
        withdrawTx.active = true;
        withdrawTx.approvedCounter = 1;
        withdrawTx.approved[msg.sender] = true;
        withdrawTx.assetAddress = assetAddress;
        withdrawTx.receiverAddress = receiverAddress;
        withdrawTx.amount = amount;
        txsCounter += 1;
    }

    function denyWithdrawTransaction(uint256 txId) public onlyOwner() {
        WithdrawTx storage withdrawTx = withdrawTxs[txId];
        withdrawTx.active = false;
    }

    function approveWithdrawTransaction(uint256 txId) public onlyOwner() {
        WithdrawTx storage withdrawTx = withdrawTxs[txId];
        require(withdrawTx.active, "Transaction must be active");
        require(!withdrawTx.approved[msg.sender], "You already approved this transaction");
        withdrawTx.approved[msg.sender] = true;
        withdrawTx.approvedCounter += 1;

        if (withdrawTx.approvedCounter >= approveLimit) {
            withdrawTx.active = false;
            IERC20(withdrawTx.assetAddress).transfer(withdrawTx.receiverAddress, withdrawTx.amount);
        }
    }
}

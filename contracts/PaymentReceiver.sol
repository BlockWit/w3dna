// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./RecoverableFunds.sol";
import "./AssetHandler.sol";

contract PaymentReceiver is AccessControl, AssetHandler, RecoverableFunds {

    event PaymentReceived(
        uint256 indexed taskId,
        address indexed buyer,
        Assets.Key indexed assetKey,
        uint256 amount
    );

    address public recipient;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        recipient = address(this);
    }

    function setRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        recipient = newRecipient;
    }

    function setAsset(Assets.Key key, string memory assetTicker, Assets.AssetType assetType) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
        return _setAsset(key, assetTicker, assetType);
    }

    function processPayment(uint256 taskId, address buyer, uint256 amount, Assets.Key assetKey, address sender) external payable {
        _transferAssetFrom(sender, recipient, amount, assetKey);
        emit PaymentReceived(taskId, buyer, assetKey, amount);
    }

    function removeAsset(Assets.Key key) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
        return _removeAsset(key);
    }

    function retrieveTokens(address recipient, address tokenAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _retrieveTokens(recipient, tokenAddress);
    }

    function retrieveETH(address payable recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _retrieveETH(recipient);
    }

}

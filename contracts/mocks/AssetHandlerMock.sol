// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.14;

import "../AssetHandler.sol";

contract AssetHandlerMock is AssetHandler {

    function setAsset(Assets.Key key, string memory assetTicker, Assets.AssetType assetType) external returns (bool) {
        return _setAsset(key, assetTicker, assetType);
    }

    function removeAsset(Assets.Key key) external returns (bool) {
        return _removeAsset(key);
    }

    function transfer(address recipient, uint256 amount, Assets.Key assetKey) external {
        return _transferAsset(recipient, amount, assetKey);
    }

    function transferFrom(address sender, address recipient, uint256 amount, Assets.Key assetKey) external {
        return _transferAssetFrom(sender, recipient, amount, assetKey);
    }

}

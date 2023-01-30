// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol, address initialAccount, uint256 initialBalance) payable ERC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }
}

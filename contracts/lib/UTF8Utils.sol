// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.14;

/**
 * UTF8 Utils
 */
library UTF8Utils {

    function length(string memory _self) internal pure returns (uint256 length) {
        bytes memory _bytes = bytes(_self);
        uint256 i = 0;
        while (i < _bytes.length) {
            i += _getCharSize(_bytes[i]);
            length++;
        }
    }

    function getCharCodeAt(string memory _self, uint256 position) internal pure returns (bytes4) {
        bytes memory _bytes = bytes(_self);
        uint256 i = 0;
        uint256 size = 0;
        while (size < position) {
            i += _getCharSize(_bytes[i]);
            size++;
        }
        bytes1 firstByte = _bytes[i];
        if (firstByte >> 7 == bytes1(0)) {
            return bytes4(firstByte) >> 24;
        } else if (firstByte >> 5 == bytes1(uint8(0x6))) {
            return bytes4(firstByte) >> 16 | bytes4(_bytes[i + 1]) >> 24;
        } else if (firstByte >> 4 == bytes1(uint8(0xe))) {
            return bytes4(firstByte) >> 8 | bytes4(_bytes[i + 1]) >> 16 | bytes4(_bytes[i + 2]) >> 24;
        } else if (firstByte >> 3 == bytes1(uint8(0x1e))) {
            return bytes4(firstByte) | bytes4(_bytes[i + 1]) >> 8 | bytes4(_bytes[i + 2]) >> 16 | bytes4(_bytes[i + 3]) >> 24;
        } else {
            revert("UTF8Utils: unsupported character");
        }
    }

    function _getCharSize(bytes1 _byte1) private pure returns (uint8 size) {
        if (_byte1 >> 7 == 0) size = 1;
        else if (_byte1 >> 5 == bytes1(uint8(0x6))) size = 2;
        else if (_byte1 >> 4 == bytes1(uint8(0xE))) size = 3;
        else if (_byte1 >> 3 == bytes1(uint8(0x1E))) size = 4;
        else revert("UTF8Utils: unsupported character");
    }

}

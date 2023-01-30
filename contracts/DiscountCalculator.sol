// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.14;


contract DiscountCalculator {

    struct Discount {
        uint256 numerator;
        uint256 denominator;
        uint256 validThru;
    }

    Discount[] public discounts;

    function _setDiscount(Discount[] calldata newDiscounts) internal {
        uint length = discounts.length;
        uint newLength = newDiscounts.length;
        uint i = 0;
        if(length == newLength) {
            while(newLength > i) {
                discounts[i] = newDiscounts[i];
                i++;
            }
        } else if(length > newLength){
            while(newLength > i) {
                discounts[i] = newDiscounts[i];
                i++;
            }
            while(length > i) {
                discounts.pop();
                i++;
            }
        } else if(length == 0) {
            while(newLength > i) {
                discounts.push(newDiscounts[i]);
                i++;
            }
        } else {
            while(length > i) {
                discounts[i] = newDiscounts[i];
                i++;
            }
            while(newLength > i) {
                discounts.push(newDiscounts[i]);
                i++;
            }
        }
    }

    function calculateDiscount(uint256 amount, uint256 timestamp) public view returns (uint256) {
        uint256 i = discounts.length;
        Discount memory discount;
        if(i > 0) {
            i--;
            while (discounts[i].validThru >= timestamp) {
                discount = discounts[i];
                if( i > 0 ){
                    i--;
                } else {
                    break;
                }
            }
        }
        return discount.denominator > 0 ? amount * discount.numerator / discount.denominator : 0;
    }
}

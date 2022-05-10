// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltyDistribution is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public artistRoyalty = 5000;
    uint256 public charityRoyalty = 5000;

    address payable public artist = payable(0xA5D82471A12FBd6fD1412e5eb5850d9d6aC5d525);
    address payable public charity = payable(0xA5D82471A12FBd6fD1412e5eb5850d9d6aC5d525);

    receive() external payable {}

    function claimEther() external nonReentrant {
        uint total = address(this).balance;
        require(total > 0, "Nothing to claim");

        artist.transfer(total*artistRoyalty/10000);
        charity.transfer(total*charityRoyalty/10000);
    }

    function claimToken(address token) external nonReentrant {
        IERC20 claimableToken = IERC20(token);
        uint total = claimableToken.balanceOf(address(this));
        require(total > 0, "Nothing to claim");
        claimableToken.safeTransfer(artist, total*artistRoyalty/10000);
        claimableToken.safeTransfer(charity, total*charityRoyalty/10000);
    }

    function changeRoyaltyShares(uint _artistRoyalty, uint _charityRoyalty) external onlyOwner {
        artistRoyalty = _artistRoyalty;
        charityRoyalty = _charityRoyalty;
    }
}


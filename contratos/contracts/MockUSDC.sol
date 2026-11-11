// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice USDC de mentira con 6 decimales, para la demo cuando el faucet no alcanza.
/// El faucet de Circle entrega 20 USDC cada 2 horas; los montos de las bandas son
/// de cientos de miles. Con este token la demo puede mostrar montos realistas.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

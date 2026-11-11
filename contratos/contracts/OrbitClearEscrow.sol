// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title OrbitClearEscrow
/// @notice Garantia de desorbitado por satelite. Cada NORAD tiene su propio escrow.
/// El operador deposita USDC al registrar el satelite. Si el relayer acredita un
/// reingreso (SATCAT DECAY_DATE) dentro del plazo, el deposito vuelve al operador.
/// Si el plazo vence con el objeto en orbita, el deposito pasa al fondo de remocion.
contract OrbitClearEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State {
        None,
        Active,
        Refunded,
        Forfeited
    }

    enum ForfeitReason {
        LateReentry,
        Expired
    }

    struct Escrow {
        address operator;
        uint64 launchedAt;
        uint64 deadline;
        uint128 deposit;
        uint8 band;
        State state;
    }

    uint8 public constant BAND_COUNT = 3;
    uint64 private constant YEAR = 365 days;

    IERC20 public immutable usdc;
    address public immutable relayer;
    address public immutable fund;

    uint32[3] public bandYears;
    uint128[3] public bandAmount;

    mapping(uint32 noradId => Escrow) private _escrows;

    uint256 public totalDeposited;
    uint256 public totalRefunded;
    uint256 public totalForfeited;

    error NotRelayer();
    error ZeroAddress();
    error AlreadyRegistered(uint32 noradId);
    error UnknownEscrow(uint32 noradId);
    error EscrowNotActive(uint32 noradId);
    error InvalidBand(uint8 band);
    error InvalidLaunchDate();
    error InvalidDecayDate();
    error NotExpired(uint32 noradId);

    event Registered(
        uint32 indexed noradId,
        address indexed operator,
        uint8 band,
        uint64 launchedAt,
        uint64 deadline,
        uint128 deposit,
        bytes32 dataHash
    );
    event ReentryAttested(uint32 indexed noradId, uint64 decayDate, bytes32 dataHash);
    event Refunded(uint32 indexed noradId, address indexed operator, uint128 amount);
    event Forfeited(uint32 indexed noradId, address indexed fund, uint128 amount, ForfeitReason reason);

    constructor(
        address usdc_,
        address relayer_,
        address fund_,
        uint32[3] memory yearsByBand_,
        uint128[3] memory amountByBand_
    ) {
        if (usdc_ == address(0) || relayer_ == address(0) || fund_ == address(0)) revert ZeroAddress();

        usdc = IERC20(usdc_);
        relayer = relayer_;
        fund = fund_;

        for (uint8 i = 0; i < BAND_COUNT; i++) {
            bandYears[i] = yearsByBand_[i];
            bandAmount[i] = amountByBand_[i];
        }
    }

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert NotRelayer();
        _;
    }

    /// @notice Crea el escrow de un satelite y cobra el deposito al operador.
    /// @param noradId Numero de catalogo NORAD.
    /// @param operator Operador responsable, origen y destinatario del deposito.
    /// @param launchedAt Fecha de lanzamiento en segundos (SATCAT LAUNCH_DATE).
    /// @param band Banda orbital: 0 baja, 1 media, 2 alta.
    /// @param dataHash keccak256 del registro crudo de CelesTrak usado.
    function register(
        uint32 noradId,
        address operator,
        uint64 launchedAt,
        uint8 band,
        bytes32 dataHash
    ) external onlyRelayer nonReentrant {
        if (_escrows[noradId].state != State.None) revert AlreadyRegistered(noradId);
        if (band >= BAND_COUNT) revert InvalidBand(band);
        if (operator == address(0)) revert ZeroAddress();
        if (launchedAt == 0 || launchedAt > block.timestamp) revert InvalidLaunchDate();

        uint64 deadline = launchedAt + uint64(bandYears[band]) * YEAR;
        uint128 deposit = bandAmount[band];

        _escrows[noradId] = Escrow({
            operator: operator,
            launchedAt: launchedAt,
            deadline: deadline,
            deposit: deposit,
            band: band,
            state: State.Active
        });

        totalDeposited += deposit;

        emit Registered(noradId, operator, band, launchedAt, deadline, deposit, dataHash);

        usdc.safeTransferFrom(operator, address(this), deposit);
    }

    /// @notice Acredita el reingreso de un satelite y liquida el escrow.
    /// Si el reingreso ocurrio dentro del plazo, devuelve. Si fue tarde, decomisa.
    /// @param noradId Numero de catalogo NORAD.
    /// @param decayDate Fecha de reingreso en segundos (SATCAT DECAY_DATE).
    /// @param dataHash keccak256 del registro crudo de CelesTrak usado.
    function attestReentry(
        uint32 noradId,
        uint64 decayDate,
        bytes32 dataHash
    ) external onlyRelayer nonReentrant {
        Escrow storage escrow = _activeEscrow(noradId);
        if (decayDate == 0) revert InvalidDecayDate();

        emit ReentryAttested(noradId, decayDate, dataHash);

        uint128 amount = escrow.deposit;

        if (decayDate <= escrow.deadline) {
            address operator = escrow.operator;
            escrow.state = State.Refunded;
            totalRefunded += amount;
            emit Refunded(noradId, operator, amount);
            usdc.safeTransfer(operator, amount);
        } else {
            escrow.state = State.Forfeited;
            totalForfeited += amount;
            emit Forfeited(noradId, fund, amount, ForfeitReason.LateReentry);
            usdc.safeTransfer(fund, amount);
        }
    }

    /// @notice Cierra un escrow cuyo plazo vencio sin reingreso. Abierto a cualquiera:
    /// el decomiso no depende de la buena voluntad del relayer.
    function closeExpired(uint32 noradId) external nonReentrant {
        Escrow storage escrow = _activeEscrow(noradId);
        if (block.timestamp <= escrow.deadline) revert NotExpired(noradId);

        uint128 amount = escrow.deposit;
        escrow.state = State.Forfeited;
        totalForfeited += amount;

        emit Forfeited(noradId, fund, amount, ForfeitReason.Expired);

        usdc.safeTransfer(fund, amount);
    }

    function escrowOf(uint32 noradId) external view returns (Escrow memory) {
        return _escrows[noradId];
    }

    function isExpired(uint32 noradId) external view returns (bool) {
        Escrow storage escrow = _escrows[noradId];
        return escrow.state == State.Active && block.timestamp > escrow.deadline;
    }

    function deadlineFor(uint64 launchedAt, uint8 band) public view returns (uint64) {
        if (band >= BAND_COUNT) revert InvalidBand(band);
        return launchedAt + uint64(bandYears[band]) * YEAR;
    }

    function _activeEscrow(uint32 noradId) private view returns (Escrow storage escrow) {
        escrow = _escrows[noradId];
        if (escrow.state == State.None) revert UnknownEscrow(noradId);
        if (escrow.state != State.Active) revert EscrowNotActive(noradId);
    }
}

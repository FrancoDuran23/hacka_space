// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DebrisEscrow (OrbitClear)
/// @notice Bono de deorbitado por objeto en órbita. Los financiadores bloquean USDC por un
///         objeto (identificado por su número de catálogo NORAD). Si el oráculo confirma el
///         deorbitado antes del plazo, todo lo bloqueado se paga al limpiador. Si vence el
///         plazo sin confirmación, cualquiera puede llamar `expire` y cada financiador
///         recupera exactamente lo que aportó.
contract DebrisEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        None,
        Active,
        Deorbited,
        Expired
    }

    struct Escrow {
        address owner;
        uint64 createdAt;
        uint64 deadline;
        Status status;
        uint256 locked;
        uint256 totalFunded;
        address cleaner;
        uint256 paidOut;
    }

    /// @notice Máximo de financiadores distintos por escrow (acota el loop de reembolso).
    uint256 public constant MAX_FUNDERS = 32;

    address public immutable usdc;
    address public immutable oracle;

    mapping(uint256 objectId => Escrow) private _escrows;
    mapping(uint256 objectId => address[]) private _funders;
    mapping(uint256 objectId => mapping(address funder => uint256)) private _contributions;
    uint256[] private _objectIds;

    event EscrowCreated(
        uint256 indexed objectId, address indexed owner, address indexed funder, uint256 amount, uint64 deadline
    );
    event FundsAdded(uint256 indexed objectId, address indexed funder, uint256 amount, uint256 totalLocked);
    event DebrisDeorbited(uint256 indexed objectId, address indexed cleaner, uint256 payout);
    event EscrowExpired(uint256 indexed objectId, uint256 refunded);

    error NotOracle();
    error InvalidStatus();
    error DeadlinePassed();
    error DeadlineNotReached();
    error InvalidDeadline();
    error ZeroAddress();
    error ZeroAmount();
    error TooManyFunders();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    constructor(address usdc_, address oracle_) {
        if (usdc_ == address(0) || oracle_ == address(0)) revert ZeroAddress();
        usdc = usdc_;
        oracle = oracle_;
    }

    /// @notice Crea el escrow del objeto `objectId` y aporta `amount` como primer financiador.
    function createEscrow(uint256 objectId, address owner, uint256 amount, uint64 deadline) external nonReentrant {
        Escrow storage e = _escrows[objectId];
        if (e.status != Status.None) revert InvalidStatus();
        if (owner == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        e.owner = owner;
        e.createdAt = uint64(block.timestamp);
        e.deadline = deadline;
        e.status = Status.Active;
        e.locked = amount;
        e.totalFunded = amount;

        _funders[objectId].push(msg.sender);
        _contributions[objectId][msg.sender] = amount;
        _objectIds.push(objectId);

        IERC20(usdc).safeTransferFrom(msg.sender, address(this), amount);

        emit EscrowCreated(objectId, owner, msg.sender, amount, deadline);
    }

    /// @notice Suma fondos a un escrow activo antes del plazo.
    function addFunds(uint256 objectId, uint256 amount) external nonReentrant {
        Escrow storage e = _escrows[objectId];
        if (e.status != Status.Active) revert InvalidStatus();
        if (block.timestamp > e.deadline) revert DeadlinePassed();
        if (amount == 0) revert ZeroAmount();

        if (_contributions[objectId][msg.sender] == 0) {
            if (_funders[objectId].length >= MAX_FUNDERS) revert TooManyFunders();
            _funders[objectId].push(msg.sender);
        }
        _contributions[objectId][msg.sender] += amount;
        e.locked += amount;
        e.totalFunded += amount;

        IERC20(usdc).safeTransferFrom(msg.sender, address(this), amount);

        emit FundsAdded(objectId, msg.sender, amount, e.locked);
    }

    /// @notice El oráculo confirma el deorbitado y se paga todo lo bloqueado al limpiador.
    function confirmDeorbit(uint256 objectId, address cleaner) external onlyOracle nonReentrant {
        Escrow storage e = _escrows[objectId];
        if (e.status != Status.Active) revert InvalidStatus();
        if (cleaner == address(0)) revert ZeroAddress();
        if (block.timestamp > e.deadline) revert DeadlinePassed();

        uint256 payout = e.locked;
        e.status = Status.Deorbited;
        e.cleaner = cleaner;
        e.paidOut = payout;
        e.locked = 0;

        IERC20(usdc).safeTransfer(cleaner, payout);

        emit DebrisDeorbited(objectId, cleaner, payout);
    }

    /// @notice Pasado el plazo sin deorbitado, cualquiera puede vencer el escrow y
    ///         reembolsar a cada financiador exactamente lo que aportó.
    function expire(uint256 objectId) external nonReentrant {
        Escrow storage e = _escrows[objectId];
        if (e.status != Status.Active) revert InvalidStatus();
        if (block.timestamp <= e.deadline) revert DeadlineNotReached();

        uint256 refunded = e.locked;
        e.status = Status.Expired;
        e.locked = 0;

        address[] storage funders = _funders[objectId];
        uint256 n = funders.length;
        for (uint256 i = 0; i < n; ++i) {
            address funder = funders[i];
            uint256 amount = _contributions[objectId][funder];
            if (amount > 0) IERC20(usdc).safeTransfer(funder, amount);
        }

        emit EscrowExpired(objectId, refunded);
    }

    function getEscrow(uint256 objectId) external view returns (Escrow memory) {
        return _escrows[objectId];
    }

    function getFunders(uint256 objectId)
        external
        view
        returns (address[] memory funders, uint256[] memory amounts)
    {
        funders = _funders[objectId];
        amounts = new uint256[](funders.length);
        for (uint256 i = 0; i < funders.length; ++i) {
            amounts[i] = _contributions[objectId][funders[i]];
        }
    }

    function getObjectIds() external view returns (uint256[] memory) {
        return _objectIds;
    }

    function escrowCount() external view returns (uint256) {
        return _objectIds.length;
    }
}

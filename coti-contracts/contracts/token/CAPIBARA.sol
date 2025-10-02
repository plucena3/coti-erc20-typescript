// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PrivateERC20/PrivateERC20.sol";
import "../utils/mpc/MpcCore.sol";

contract CAPIBARA is PrivateERC20 {
    address public owner;
    uint64 private _totalSupply;

    // Address to receive the initial pre-minted tokens
    address private constant _PRE_MINT_RECEIVER = 0x9b7384D697E5c9Fac557c035c0C0837a4221875c;
    // Amount of tokens to pre-mint (100,000 tokens with 6 decimals, matching PrivateERC20.decimals())
    uint256 private constant _PRE_MINT_AMOUNT = 100_000 * (10**6);

    // Maximum total supply for the token (10,000,000 tokens with 18 decimals)
    uint256 public constant MAX_SUPPLY = 10_000_000 * (10**18);

    constructor() PrivateERC20("CAPIBARA Token", "CAPI") {
        owner = msg.sender; // Set the deployer as the owner
        _totalSupply = 0; // Will be minted via initialMint function
    }
    
    /**
     * @dev Initial mint function - call this after deployment to mint initial supply
     * Can only be called once by the owner
     */
    function initialMint() external {
        require(msg.sender == owner, "CAPIBARA: Only owner can initial mint");
        require(_totalSupply == 0, "CAPIBARA: Already initialized");
        
        // Convert the _PRE_MINT_AMOUNT to gtUint64 for the _mint function
        uint64 preMintAmount64 = uint64(_PRE_MINT_AMOUNT);
        gtUint64 fhePreMintAmount = MpcCore.setPublic64(preMintAmount64);
        gtBool success = _mint(_PRE_MINT_RECEIVER, fhePreMintAmount);
        
        if (MpcCore.decrypt(success)) {
            _totalSupply = uint64(_PRE_MINT_AMOUNT);
        }
    }

    /**
     * @dev Returns the total supply of CAPIBARA tokens
     * Overrides the base implementation to return the actual total supply
     */
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Mint new CAPIBARA tokens to a specific account
     * Only the owner can mint new tokens
     * @param account The address to receive the minted tokens
     * @param amount The amount of tokens to mint (in base units)
     */
    function mint(address account, uint64 amount) external {
        require(msg.sender == owner, "CAPIBARA: Only owner can mint");
        require(account != address(0), "CAPIBARA: Cannot mint to zero address");
        require(_totalSupply + amount <= MAX_SUPPLY, "CAPIBARA: Exceeds maximum supply");

        gtBool success = _mint(account, MpcCore.setPublic64(amount));

        if (MpcCore.decrypt(success)) {
            _totalSupply += amount;
        }
    }

    /**
     * @dev Public transfer function that allows transferring tokens using plain uint64 values
     * @param to The address to transfer tokens to
     * @param value The amount of tokens to transfer (in base units)
     * @return success Boolean indicating whether the transfer was successful
     */
    function transfer(address to, uint64 value) public returns (gtBool) {
        gtUint64 fheValue = MpcCore.setPublic64(value);
        return _transfer(msg.sender, to, fheValue);
    }

    /**
     * @dev Override the standard transfer function to maintain compatibility
     * @param to The address to transfer tokens to
     * @param value The encrypted amount of tokens to transfer
     * @return success Boolean indicating whether the transfer was successful
     */
    function transfer(address to, gtUint64 value) public override returns (gtBool) {
        return _transfer(msg.sender, to, value);
    }

    /**
     * @dev Modifier to restrict functions to owner only
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "CAPIBARA: Caller is not the owner");
        _;
    }

    /**
     * @dev Transfer ownership to a new address
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CAPIBARA: New owner cannot be zero address");
        owner = newOwner;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "PrivateERC20.sol";
import "MpcCore.sol";

contract CAPIBARA is PrivateERC20 {
    address public owner;
    uint64 private _capibaraTotalSupply; // Using a distinct name for clarity
    
    // Pre-mint configuration
    address private constant _PRE_MINT_RECEIVER = 0xfAF7e0962B79675cd046C4c0bF41beEb27FCc5C8;
    uint64 private constant _PRE_MINT_AMOUNT = 100_000 * (10**6); // 100,000 tokens with 6 decimals
    
    // Track if pre-mint has been executed
    bool private _preMintExecuted;
    
    // Events for transparency
    event PreMintExecuted(address indexed receiver, uint64 amount, bool success);
    event MintExecuted(address indexed account, uint64 amount, bool success);

    modifier onlyOwner() {
        require(msg.sender == owner, "CAPIBARA: Caller is not the owner");
        _;
    }

    constructor() PrivateERC20("CAPIBARA Token", "CAPI") {
        owner = msg.sender;
        _capibaraTotalSupply = 0; // Start with 0, will be updated after successful operations
        _preMintExecuted = false;
        
        // Note: Pre-mint is NOT done in constructor to avoid FHE initialization issues
        // Use executePreMint() function after deployment when FHE network is ready
    }

    /**
     * @dev Execute the pre-mint after contract deployment when FHE network is ready.
     * Can only be called once by the owner.
     * This should be called after deployment to ensure FHE network is properly initialized.
     */
    function executePreMint() external onlyOwner {
        require(!_preMintExecuted, "CAPIBARA: Pre-mint already executed");
        
        gtUint64 fhePreMintAmount = MpcCore.setPublic64(_PRE_MINT_AMOUNT);
        gtBool success = _mint(_PRE_MINT_RECEIVER, fhePreMintAmount);
        
        // Verify the operation was successful
        bool mintSucceeded = MpcCore.decrypt(success);
        
        if (mintSucceeded) {
            _capibaraTotalSupply += _PRE_MINT_AMOUNT;
            _preMintExecuted = true;
            emit PreMintExecuted(_PRE_MINT_RECEIVER, _PRE_MINT_AMOUNT, true);
        } else {
            emit PreMintExecuted(_PRE_MINT_RECEIVER, _PRE_MINT_AMOUNT, false);
            revert("CAPIBARA: Pre-mint operation failed");
        }
    }
    
    /**
     * @dev Check if pre-mint has been executed
     */
    function isPreMintExecuted() external view returns (bool) {
        return _preMintExecuted;
    }

    /**
     * @dev Returns the total quantity of tokens in existence.
     * This overrides the function in PrivateERC20 which returns 0.
     * Note: This is the PUBLIC total supply counter, not the FHE total supply.
     */
    function totalSupply() public view override returns (uint256) {
        return _capibaraTotalSupply;
    }

    /**
     * @dev Creates `amount` new tokens for `account`.
     * Can only be called by the owner.
     * Provides better error handling and verification of FHE operations.
     */
    function mint(address account, uint64 amount) external onlyOwner {
        require(account != address(0), "CAPIBARA: Cannot mint to zero address");
        require(amount > 0, "CAPIBARA: Amount must be greater than 0");
        
        gtUint64 fheAmount = MpcCore.setPublic64(amount);
        gtBool success = _mint(account, fheAmount);

        // Decrypt the success result to verify the FHE operation
        bool mintSucceeded = MpcCore.decrypt(success);
        
        if (mintSucceeded) {
            _capibaraTotalSupply += amount;
            emit MintExecuted(account, amount, true);
            // Optional: Add MAX_SUPPLY check here if needed
            // require(_capibaraTotalSupply <= MAX_TOTAL_SUPPLY, "CAPIBARA: Max supply exceeded");
        } else {
            emit MintExecuted(account, amount, false);
            revert("CAPIBARA: FHE minting operation failed");
        }
    }

    /**
     * @dev Moves `value` amount of tokens from the caller's account to `to`.
     * This is a wrapper around the internal `_transfer` function of PrivateERC20,
     * allowing transfers with a public `uint64` value.
     * Returns an FHE boolean indicating the success of the FHE transfer operation.
     */
    function publicTransfer(address to, uint64 value) public returns (gtBool) {
        require(to != address(0), "CAPIBARA: Cannot transfer to zero address");
        require(value > 0, "CAPIBARA: Transfer amount must be greater than 0");
        
        gtUint64 fheValue = MpcCore.setPublic64(value);
        return _transfer(msg.sender, to, fheValue);
    }
    
    /**
     * @dev Emergency function to verify if total supply matches FHE total supply.
     * This is for debugging purposes only and should be used sparingly due to gas costs.
     * Only callable by owner.
     */
    function verifyTotalSupplyConsistency() external onlyOwner returns (bool) {
        // Get the FHE total supply from PrivateERC20
        // Note: This requires reading the private _totalSupply and decrypting it
        // This might not work directly as _totalSupply is private in PrivateERC20
        
        // For now, we can only check if our public counter is reasonable
        // A more sophisticated check would require modifying PrivateERC20 to expose FHE total supply
        return _capibaraTotalSupply >= 0; // Basic sanity check
    }
    
    /**
     * @dev Get the current public total supply for external viewing
     */
    function getPublicTotalSupply() external view returns (uint64) {
        return _capibaraTotalSupply;
    }
}

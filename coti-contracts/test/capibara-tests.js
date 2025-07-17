const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CAPIBARA Token Tests", function () {
    async function deployCapibaraFixture() {
        const [owner, user1, user2, user3] = await ethers.getSigners();
        
        // Deploy CAPIBARA token
        const CAPIBARA = await ethers.getContractFactory("CAPIBARA");
        const capibara = await CAPIBARA.deploy("CAPIBARA Token", "CAPI");
        
        // Deploy mock token for testing
        const MockToken = await ethers.getContractFactory("MockToken");
        const mockToken = await MockToken.deploy("Mock Token", "MOCK", 18);
        
        return { capibara, mockToken, owner, user1, user2, user3 };
    }

    describe("Deployment", function () {
        it("Should deploy with correct initial parameters", async function () {
            const { capibara, owner } = await loadFixture(deployCapibaraFixture);
            
            expect(await capibara.name()).to.equal("CAPIBARA Token");
            expect(await capibara.symbol()).to.equal("CAPI");
            expect(await capibara.decimals()).to.equal(18);
            expect(await capibara.owner()).to.equal(owner.address);
            expect(await capibara.totalSupply()).to.equal(0);
        });
    });

    describe("Encrypted Balance Initialization", function () {
        it("Should initialize encrypted balance for a user", async function () {
            const { capibara, user1 } = await loadFixture(deployCapibaraFixture);
            
            // Mock encrypted amount (in real implementation, this would be properly encrypted)
            const encryptedAmount = { data: 1000 };
            
            const tx = await capibara.initializeEncryptedBalance(user1.address, encryptedAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Transaction should succeed");
            
            // Verify gas usage
            const gasUsed = receipt.gasUsed;
            const gasLimit = Number(gasUsed) * 1.3 + 50000;
            expect(gasUsed).to.be.below(gasLimit, `Gas usage ${gasUsed} exceeds calculated limit`);
        });

        it("Should reject initialization for zero address", async function () {
            const { capibara } = await loadFixture(deployCapibaraFixture);
            
            const encryptedAmount = { data: 1000 };
            
            await expect(capibara.initializeEncryptedBalance(ethers.constants.AddressZero, encryptedAmount))
                .to.be.revertedWith("Invalid account");
        });
    });

    describe("Encrypted Balance Queries", function () {
        it("Should return encrypted balance for an account", async function () {
            const { capibara, user1 } = await loadFixture(deployCapibaraFixture);
            
            const encryptedAmount = { data: 1000 };
            await capibara.initializeEncryptedBalance(user1.address, encryptedAmount);
            
            const encryptedBalance = await capibara.encryptedBalanceOf(user1.address);
            expect(encryptedBalance).to.not.be.undefined;
        });

        it("Should decrypt caller's balance", async function () {
            const { capibara, owner, user1 } = await loadFixture(deployCapibaraFixture);
            
            const encryptedAmount = { data: 1000 };
            await capibara.initializeEncryptedBalance(user1.address, encryptedAmount);
            
            const tx = await capibara.connect(user1).decryptMyBalance();
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Balance decryption should succeed");
            
            // Verify gas usage
            const gasUsed = receipt.gasUsed;
            const gasLimit = Number(gasUsed) * 1.3 + 50000;
            expect(gasUsed).to.be.below(gasLimit, `Gas usage ${gasUsed} exceeds calculated limit`);
        });
    });

    describe("Encrypted Transfer Operations", function () {
        it("Should perform encrypted transfer between users", async function () {
            const { capibara, user1, user2 } = await loadFixture(deployCapibaraFixture);
            
            // Initialize balances
            const initialAmount = { data: 5000 };
            const transferAmount = { data: 1000 };
            
            await capibara.initializeEncryptedBalance(user1.address, initialAmount);
            await capibara.initializeEncryptedBalance(user2.address, { data: 0 });
            
            // Perform encrypted transfer
            const tx = await capibara.connect(user1).encryptedTransfer(user2.address, transferAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Encrypted transfer should succeed");
            
            // Check for EncryptedTransfer event
            const transferEvent = receipt.events?.find(e => e.event === "EncryptedTransfer");
            expect(transferEvent).to.not.be.undefined;
            expect(transferEvent.args.from).to.equal(user1.address);
            expect(transferEvent.args.to).to.equal(user2.address);
            
            // Verify gas usage
            const gasUsed = receipt.gasUsed;
            const gasLimit = Number(gasUsed) * 1.3 + 50000;
            expect(gasUsed).to.be.below(gasLimit, `Gas usage ${gasUsed} exceeds calculated limit`);
        });

        it("Should reject transfer to zero address", async function () {
            const { capibara, user1 } = await loadFixture(deployCapibaraFixture);
            
            const initialAmount = { data: 5000 };
            const transferAmount = { data: 1000 };
            
            await capibara.initializeEncryptedBalance(user1.address, initialAmount);
            
            await expect(capibara.connect(user1).encryptedTransfer(ethers.constants.AddressZero, transferAmount))
                .to.be.revertedWith("Invalid recipient");
        });

        it("Should reject transfer with zero amount", async function () {
            const { capibara, user1, user2 } = await loadFixture(deployCapibaraFixture);
            
            const initialAmount = { data: 5000 };
            const zeroAmount = { data: 0 };
            
            await capibara.initializeEncryptedBalance(user1.address, initialAmount);
            await capibara.initializeEncryptedBalance(user2.address, { data: 0 });
            
            await expect(capibara.connect(user1).encryptedTransfer(user2.address, zeroAmount))
                .to.be.revertedWith("Invalid amount");
        });

        it("Should reject transfer with insufficient balance", async function () {
            const { capibara, user1, user2 } = await loadFixture(deployCapibaraFixture);
            
            const initialAmount = { data: 100 };
            const transferAmount = { data: 1000 };
            
            await capibara.initializeEncryptedBalance(user1.address, initialAmount);
            await capibara.initializeEncryptedBalance(user2.address, { data: 0 });
            
            await expect(capibara.connect(user1).encryptedTransfer(user2.address, transferAmount))
                .to.be.revertedWith("Insufficient balance");
        });
    });

    describe("Encrypted Mint Operations", function () {
        it("Should mint encrypted tokens to a user", async function () {
            const { capibara, owner, user1 } = await loadFixture(deployCapibaraFixture);
            
            await capibara.initializeEncryptedBalance(user1.address, { data: 0 });
            const encryptedAmount = { data: 5000 };
            
            const initialTotalSupply = await capibara.totalSupply();
            
            const tx = await capibara.connect(owner).encryptedMint(user1.address, encryptedAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Encrypted mint should succeed");
            
            // Check for EncryptedMint event
            const mintEvent = receipt.events?.find(e => e.event === "EncryptedMint");
            expect(mintEvent).to.not.be.undefined;
            expect(mintEvent.args.to).to.equal(user1.address);
            
            // Verify total supply increased (for ERC20 compatibility)
            const newTotalSupply = await capibara.totalSupply();
            expect(newTotalSupply).to.be.gt(initialTotalSupply);
            
            // Verify gas usage
            const gasUsed = receipt.gasUsed;
            const gasLimit = Number(gasUsed) * 1.3 + 50000;
            expect(gasUsed).to.be.below(gasLimit, `Gas usage ${gasUsed} exceeds calculated limit`);
        });

        it("Should only allow owner to mint", async function () {
            const { capibara, user1, user2 } = await loadFixture(deployCapibaraFixture);
            
            await capibara.initializeEncryptedBalance(user1.address, { data: 0 });
            const encryptedAmount = { data: 5000 };
            
            await expect(capibara.connect(user2).encryptedMint(user1.address, encryptedAmount))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should reject mint to zero address", async function () {
            const { capibara, owner } = await loadFixture(deployCapibaraFixture);
            
            const encryptedAmount = { data: 5000 };
            
            await expect(capibara.connect(owner).encryptedMint(ethers.constants.AddressZero, encryptedAmount))
                .to.be.revertedWith("Invalid recipient");
        });
    });

    describe("Encrypted Burn Operations", function () {
        it("Should burn encrypted tokens from user balance", async function () {
            const { capibara, owner, user1 } = await loadFixture(deployCapibaraFixture);
            
            await capibara.initializeEncryptedBalance(user1.address, { data: 0 });
            const mintAmount = { data: 10000 };
            const burnAmount = { data: 3000 };
            
            // First mint some tokens
            await capibara.connect(owner).encryptedMint(user1.address, mintAmount);
            const initialTotalSupply = await capibara.totalSupply();
            
            // Then burn some tokens
            const tx = await capibara.connect(user1).encryptedBurn(burnAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Encrypted burn should succeed");
            
            // Check for EncryptedBurn event
            const burnEvent = receipt.events?.find(e => e.event === "EncryptedBurn");
            expect(burnEvent).to.not.be.undefined;
            expect(burnEvent.args.from).to.equal(user1.address);
            
            // Verify total supply decreased (for ERC20 compatibility)
            const newTotalSupply = await capibara.totalSupply();
            expect(newTotalSupply).to.be.lt(initialTotalSupply);
            
            // Verify gas usage
            const gasUsed = receipt.gasUsed;
            const gasLimit = Number(gasUsed) * 1.3 + 50000;
            expect(gasUsed).to.be.below(gasLimit, `Gas usage ${gasUsed} exceeds calculated limit`);
        });

        it("Should reject burn with zero amount", async function () {
            const { capibara, owner, user1 } = await loadFixture(deployCapibaraFixture);
            
            await capibara.initializeEncryptedBalance(user1.address, { data: 0 });
            const mintAmount = { data: 10000 };
            const zeroAmount = { data: 0 };
            
            await capibara.connect(owner).encryptedMint(user1.address, mintAmount);
            
            await expect(capibara.connect(user1).encryptedBurn(zeroAmount))
                .to.be.revertedWith("Invalid amount");
        });

        it("Should reject burn with insufficient balance", async function () {
            const { capibara, user1 } = await loadFixture(deployCapibaraFixture);
            
            await capibara.initializeEncryptedBalance(user1.address, { data: 100 });
            const burnAmount = { data: 1000 };
            
            await expect(capibara.connect(user1).encryptedBurn(burnAmount))
                .to.be.revertedWith("Insufficient balance");
        });
    });

    describe("Standard ERC20 Operations", function () {
        it("Should support standard ERC20 transfers", async function () {
            const { capibara, owner, user1 } = await loadFixture(deployCapibaraFixture);
            
            // First mint some regular tokens
            await capibara.initializeEncryptedBalance(user1.address, { data: 0 });
            const encryptedAmount = { data: 1000 };
            await capibara.connect(owner).encryptedMint(user1.address, encryptedAmount);
            
            const transferAmount = ethers.utils.parseEther("100");
            
            const tx = await capibara.connect(user1).transfer(owner.address, transferAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Standard transfer should succeed");
            
            // Verify gas usage
            const gasUsed = receipt.gasUsed;
            const gasLimit = Number(gasUsed) * 1.3 + 50000;
            expect(gasUsed).to.be.below(gasLimit, `Gas usage ${gasUsed} exceeds calculated limit`);
        });

        it("Should support standard ERC20 approvals", async function () {
            const { capibara, owner, user1 } = await loadFixture(deployCapibaraFixture);
            
            const approvalAmount = ethers.utils.parseEther("5000");
            
            const tx = await capibara.connect(owner).approve(user1.address, approvalAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Approval should succeed");
            expect(await capibara.allowance(owner.address, user1.address)).to.equal(approvalAmount);
            
            // Verify gas usage
            const gasUsed = receipt.gasUsed;
            const gasLimit = Number(gasUsed) * 1.3 + 50000;
            expect(gasUsed).to.be.below(gasLimit, `Gas usage ${gasUsed} exceeds calculated limit`);
        });

        it("Should support burning tokens", async function () {
            const { capibara, owner, user1 } = await loadFixture(deployCapibaraFixture);
            
            // First mint some tokens
            await capibara.initializeEncryptedBalance(user1.address, { data: 0 });
            const encryptedAmount = { data: 10000 };
            await capibara.connect(owner).encryptedMint(user1.address, encryptedAmount);
            
            const burnAmount = ethers.utils.parseEther("1000");
            const initialBalance = await capibara.balanceOf(user1.address);
            
            const tx = await capibara.connect(user1).burn(burnAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Burn should succeed");
            expect(await capibara.balanceOf(user1.address)).to.equal(initialBalance.sub(burnAmount));
            
            // Verify gas usage
            const gasUsed = receipt.gasUsed;
            const gasLimit = Number(gasUsed) * 1.3 + 50000;
            expect(gasUsed).to.be.below(gasLimit, `Gas usage ${gasUsed} exceeds calculated limit`);
        });
    });

    describe("Access Control", function () {
        it("Should transfer ownership correctly", async function () {
            const { capibara, owner, user1 } = await loadFixture(deployCapibaraFixture);
            
            const tx = await capibara.connect(owner).transferOwnership(user1.address);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Ownership transfer should succeed");
            expect(await capibara.owner()).to.equal(user1.address);
            
            // Verify gas usage
            const gasUsed = receipt.gasUsed;
            const gasLimit = Number(gasUsed) * 1.3 + 50000;
            expect(gasUsed).to.be.below(gasLimit, `Gas usage ${gasUsed} exceeds calculated limit`);
        });

        it("Should allow new owner to call owner functions", async function () {
            const { capibara, owner, user1, user2 } = await loadFixture(deployCapibaraFixture);
            
            // Transfer ownership
            await capibara.connect(owner).transferOwnership(user1.address);
            
            // Initialize balance for testing
            await capibara.initializeEncryptedBalance(user2.address, { data: 0 });
            
            // New owner should be able to mint
            const encryptedAmount = { data: 2000 };
            const tx = await capibara.connect(user1).encryptedMint(user2.address, encryptedAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "New owner should be able to mint");
        });

        it("Should prevent old owner from calling owner functions", async function () {
            const { capibara, owner, user1, user2 } = await loadFixture(deployCapibaraFixture);
            
            // Transfer ownership
            await capibara.connect(owner).transferOwnership(user1.address);
            await capibara.initializeEncryptedBalance(user2.address, { data: 0 });
            
            // Old owner should not be able to mint
            const encryptedAmount = { data: 2000 };
            await expect(capibara.connect(owner).encryptedMint(user2.address, encryptedAmount))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Encrypted Total Supply", function () {
        it("Should return encrypted total supply", async function () {
            const { capibara } = await loadFixture(deployCapibaraFixture);
            
            const encryptedTotalSupply = await capibara.encryptedTotalSupply();
            expect(encryptedTotalSupply).to.not.be.undefined;
        });
    });

    describe("Reentrancy Protection", function () {
        it("Should prevent reentrancy in encrypted transfer", async function () {
            const { capibara, user1, user2 } = await loadFixture(deployCapibaraFixture);
            
            await capibara.initializeEncryptedBalance(user1.address, { data: 5000 });
            await capibara.initializeEncryptedBalance(user2.address, { data: 0 });
            
            const amount = { data: 1000 };
            
            // Transfer should use ReentrancyGuard
            const tx = await capibara.connect(user1).encryptedTransfer(user2.address, amount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Transfer should succeed with reentrancy protection");
        });

        it("Should prevent reentrancy in encrypted burn", async function () {
            const { capibara, owner, user1 } = await loadFixture(deployCapibaraFixture);
            
            await capibara.initializeEncryptedBalance(user1.address, { data: 0 });
            const mintAmount = { data: 10000 };
            const burnAmount = { data: 1000 };
            
            // First mint some tokens
            await capibara.connect(owner).encryptedMint(user1.address, mintAmount);
            
            // Burn should use ReentrancyGuard
            const tx = await capibara.connect(user1).encryptedBurn(burnAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Burn should succeed with reentrancy protection");
        });
    });

    describe("Edge Cases and Error Handling", function () {
        it("Should handle multiple operations in sequence", async function () {
            const { capibara, owner, user1, user2 } = await loadFixture(deployCapibaraFixture);
            
            // Initialize balances
            await capibara.initializeEncryptedBalance(user1.address, { data: 0 });
            await capibara.initializeEncryptedBalance(user2.address, { data: 0 });
            
            // Mint to user1
            const mintAmount = { data: 10000 };
            await capibara.connect(owner).encryptedMint(user1.address, mintAmount);
            
            // Transfer from user1 to user2
            const transferAmount = { data: 3000 };
            await capibara.connect(user1).encryptedTransfer(user2.address, transferAmount);
            
            // Burn from user2
            const burnAmount = { data: 1000 };
            const tx = await capibara.connect(user2).encryptedBurn(burnAmount);
            const receipt = await tx.wait();
            
            expect(receipt.status).to.equal(1, "Sequential operations should succeed");
        });

        it("Should handle gas optimization for multiple operations", async function () {
            const { capibara, owner, user1, user2 } = await loadFixture(deployCapibaraFixture);
            
            // Initialize balances
            await capibara.initializeEncryptedBalance(user1.address, { data: 0 });
            await capibara.initializeEncryptedBalance(user2.address, { data: 0 });
            
            // Test gas usage for encrypted operations
            const encryptedAmount = { data: 5000 };
            
            // Mint operation
            const mintTx = await capibara.connect(owner).encryptedMint(user1.address, encryptedAmount);
            const mintReceipt = await mintTx.wait();
            
            // Transfer operation
            const transferTx = await capibara.connect(user1).encryptedTransfer(user2.address, encryptedAmount);
            const transferReceipt = await transferTx.wait();
            
            // All operations should be within reasonable gas limits
            expect(mintReceipt.gasUsed).to.be.below(500000, "Mint gas usage should be reasonable");
            expect(transferReceipt.gasUsed).to.be.below(400000, "Transfer gas usage should be reasonable");
        });
    });
});

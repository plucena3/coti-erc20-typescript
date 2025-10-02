import hre from "hardhat";
import { CotiNetwork, getDefaultProvider, Wallet } from "@coti-io/coti-ethers";

/**
 * CAPIBARA Token Deployment Script (Fixed Version)
 * 
 * This script deploys the fixed CAPIBARA token contract that mints to the deployer
 * and then transfers to the target address, avoiding onboarding issues.
 * 
 * Setup Instructions:
 * 1. Ensure your .env file contains: PRIVATE_KEY=your_private_key
 * 2. Fund the account with testnet tokens from COTI faucet
 * 3. Run: npx hardhat run scripts/deploy-capibara-fixed.ts --network coti-testnet
 */

async function main() {
    console.log("Starting CAPIBARA Token deployment (Fixed Version)...");
    
    // Target address to receive the initial supply
    const targetAddress = "0x9b7384D697E5c9Fac557c035c0C0837a4221875c";
    
    // Get the private key from environment or use setupAccounts
    const provider = getDefaultProvider(CotiNetwork.Testnet);
    let deployer;
    
    if (process.env.PRIVATE_KEY) {
        // Use the private key from environment if available
        deployer = new Wallet(process.env.PRIVATE_KEY, provider);
        console.log("Using private key from environment for account:", deployer.address);
    } else {
        // Fallback to setupAccounts if no private key is provided
        const { setupAccounts } = await import("./utils/accounts");
        const [fallbackAccount] = await setupAccounts();
        deployer = fallbackAccount;
        console.log("No PRIVATE_KEY found, using setupAccounts:", deployer.address);
    }
    
    console.log("Deploying CAPIBARA Token with account:", deployer.address);
    
    // Check account balance
    const balance = await provider.getBalance(deployer.address);
    console.log("Account balance:", balance.toString());
    
    if (balance === BigInt(0)) {
        console.error("❌ ERROR: Account has zero balance!");
        console.log("📝 ACTION REQUIRED:");
        console.log("1. Visit COTI Testnet Faucet: https://faucet.coti.io");
        console.log("2. Fund this account:", deployer.address);
        console.log("3. Wait for funding confirmation");
        console.log("4. Re-run the deployment script");
        throw new Error("Account funding required before deployment");
    }

    // Get the contract factory for CAPIBARA_FIXED
    const CAPIBARAAFactory = await hre.ethers.getContractFactory("CAPIBARA_FIXED");

    // Deploy the CAPIBARA contract (mints to deployer)
    console.log("Deploying CAPIBARA Token (Fixed Version)...");
    
    let capibaraToken;
    
    try {
        // Deploy with conservative gas settings
        capibaraToken = await CAPIBARAAFactory
            .connect(deployer)
            .deploy({
                gasLimit: BigInt(2000000), // Increased gas limit for safety
                gasPrice: BigInt(500000000) // 0.5 gwei
            });
        
        console.log("Deployment transaction sent, waiting for confirmation...");
        await capibaraToken.waitForDeployment();
        
    } catch (deployError: any) {
        console.error("❌ Deployment failed:", deployError.message);
        throw deployError;
    }

    const contractAddress = await capibaraToken.getAddress();
    console.log("CAPIBARA Token deployed to:", contractAddress);
    
    // Verify deployment details
    console.log("\n=== Deployment Summary ===");
    console.log("Contract Name: CAPIBARA Token (Fixed)");
    console.log("Symbol: CAPI");
    console.log("Deployed Address:", contractAddress);
    console.log("Deployer Address:", deployer.address);
    console.log("Initial Supply Minted To:", deployer.address);
    console.log("Target Address for Transfer:", targetAddress);
    console.log("Pre-minted Amount: 100,000 CAPI tokens");
    console.log("Maximum Supply: 10,000,000 CAPI tokens");
    console.log("Network: COTI Testnet");
    
    // Additional contract verification
    try {
        const totalSupply = await capibaraToken.totalSupply();
        const contractOwner = await capibaraToken.owner();
        console.log("\n=== Contract Verification ===");
        console.log("Total Supply:", totalSupply.toString());
        console.log("Contract Owner:", contractOwner);
        
        // Transfer initial supply to target address
        console.log("\n=== Transferring Initial Supply ===");
        console.log("Transferring initial supply from deployer to target address...");
        
        const transferTx = await capibaraToken.transferInitialSupply(targetAddress);
        await transferTx.wait();
        
        console.log("✅ Initial supply transferred to:", targetAddress);
        console.log("Deployment and initial transfer completed! ✅");
        
    } catch (error: any) {
        console.log("Note: Contract verification or transfer failed:");
        console.log(error.message);
        console.log("Deployment completed but post-deployment steps skipped");
    }
    
    console.log("\n🎉 CAPIBARA Token deployment completed successfully!");
    console.log("💡 Contract Address:", contractAddress);
    console.log("💡 Owner Address:", deployer.address);
    console.log("💡 Initial Supply Location:", targetAddress);
}

main().catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exitCode = 1;
});
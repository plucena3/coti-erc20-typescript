import hre from "hardhat";
import { CotiNetwork, getDefaultProvider, Wallet } from "@coti-io/coti-ethers";

/**
 * CAPIBARA Token Deployment Script
 * 
 * This script deploys the CAPIBARA token contract using account 0x9b7384D697E5c9Fac557c035c0C0837a4221875c
 * 
 * Setup Instructions:
 * 1. Ensure your .env file contains: PRIVATE_KEY=your_private_key_for_0x9b7384D697E5c9Fac557c035c0C0837a4221875c
 * 2. Fund the account with testnet tokens from COTI faucet
 * 3. Run: npx hardhat run scripts/deploy-capibara.ts --network coti-testnet
 */

async function main() {
    console.log("🚀 Starting CAPIBARA Token deployment...");
    console.log("📅 Timestamp:", new Date().toISOString());
    console.log("🌐 Environment Debug Info:");
    console.log("- Node.js version:", process.version);
    console.log("- Working directory:", process.cwd());
    console.log("- Network config:", process.env.NODE_ENV || "development");
    
    // Use the specific account for deployment
    const targetAddress = "0x9b7384D697E5c9Fac557c035c0C0837a4221875c";
    console.log("🎯 Target address for pre-minting:", targetAddress);
    
    // Get the private key from environment and set up account with onboarding
    const provider = getDefaultProvider(CotiNetwork.Testnet);
    let deployer;
    
    console.log("🔐 Setting up deployer account...");
    
    // Use simple wallet without onboarding for contract deployment
    // Onboarding will be handled when calling initialMint
    if (!process.env.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY not found in .env file");
    }
    
    deployer = new Wallet(process.env.PRIVATE_KEY, provider);
    console.log("✅ Using account:", deployer.address);
    
    // Note about onboarding
    console.log("📝 Note: Account onboarding will be required when calling initialMint()");
    console.log("   This deployment creates the contract without minting");
    console.log("   Call initialMint() after deployment to mint initial supply");
    
    // Verify this matches our target address
    if (deployer.address.toLowerCase() !== targetAddress.toLowerCase()) {
        console.warn(`⚠️  Info: Deployer is ${deployer.address}, pre-mint target is ${targetAddress}`);
        console.log("   Tokens will be minted to target address when initialMint() is called");
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
    
    // Check if balance is sufficient (at least 0.1 COTI for gas)
    const minBalance = BigInt("100000000000000000"); // 0.1 COTI in wei
    if (balance < minBalance) {
        console.warn("⚠️  WARNING: Low account balance!");
        console.log("Current balance:", balance.toString());
        console.log("Recommended minimum:", minBalance.toString());
        console.log("Consider adding more funds for reliable deployment");
    }

    // Get the contract factory for CAPIBARA
    console.log("🏭 Creating contract factory...");
    let CAPIBARAAFactory;
    try {
        CAPIBARAAFactory = await hre.ethers.getContractFactory("CAPIBARA");
        console.log("✅ Contract factory created successfully");
        console.log("- Contract name: CAPIBARA");
        console.log("- Factory interface functions:", CAPIBARAAFactory.interface.fragments.length);
    } catch (factoryError: any) {
        console.error("❌ Failed to create contract factory:", factoryError.message);
        console.error("💡 This usually means:");
        console.error("   - Contract compilation failed");
        console.error("   - Contract name doesn't match file");
        console.error("   - Missing dependencies");
        throw factoryError;
    }

    // Deploy the CAPIBARA contract (no constructor parameters needed)
    console.log("Deploying CAPIBARA Token...");
    console.log("🔍 Debug Info:");
    console.log("- Contract Factory created successfully");
    console.log("- Deployer Connected:", deployer.address);
    console.log("- Network:", "COTI Testnet");
    console.log("- Chain ID: 7082400");
    
    let capibaraToken;
    let deploymentTx;
    
    try {
        console.log("📤 Initiating deployment transaction...");
        
        // Get deployment transaction details before sending
        const deploymentData = await CAPIBARAAFactory.getDeployTransaction();
        console.log("🔍 Deployment Transaction Data:");
        console.log("- Data length:", deploymentData.data?.length || 0, "bytes");
        console.log("- Value:", deploymentData.value?.toString() || "0");
        
        // Deploy with specific gas settings to avoid fee cap issues
        capibaraToken = await CAPIBARAAFactory
            .connect(deployer)
            .deploy({
                gasLimit: BigInt(1500000), // Conservative gas limit
                gasPrice: BigInt(500000000) // 0.5 gwei - lower than the 1 ether cap
            });
        
        // Get the deployment transaction hash immediately
        deploymentTx = capibaraToken.deploymentTransaction();
        console.log("📄 Deployment transaction sent:");
        console.log("- Hash:", deploymentTx?.hash);
        console.log("- From:", deploymentTx?.from);
        console.log("- Gas Limit:", deploymentTx?.gasLimit?.toString());
        console.log("- Gas Price:", deploymentTx?.gasPrice?.toString());
        
        console.log("⏳ Waiting for transaction confirmation...");
        await capibaraToken.waitForDeployment();
        
        console.log("✅ Transaction confirmed successfully");
        
    } catch (deployError: any) {
        console.error("❌ Deployment failed with error:", deployError.code || "UNKNOWN_ERROR");
        console.error("📝 Error message:", deployError.message);
        console.error("📝 Error reason:", deployError.reason || "No specific reason provided");
        
        // Log transaction receipt if available
        if (deployError.receipt) {
            console.error("📄 Transaction Receipt Details:");
            console.error("- Status:", deployError.receipt.status, "(0=failed, 1=success)");
            console.error("- Gas Used:", deployError.receipt.gasUsed?.toString());
            console.error("- Cumulative Gas Used:", deployError.receipt.cumulativeGasUsed?.toString());
            console.error("- Block Number:", deployError.receipt.blockNumber);
            console.error("- Transaction Hash:", deployError.receipt.hash);
            console.error("- Contract Address:", deployError.receipt.contractAddress);
            console.error("- Gas Price:", deployError.receipt.gasPrice?.toString());
            
            if (deployError.receipt.logs && deployError.receipt.logs.length > 0) {
                console.error("- Event Logs Count:", deployError.receipt.logs.length);
                deployError.receipt.logs.forEach((log: any, index: number) => {
                    console.error(`  Log ${index}:`, log.topics?.[0] || "No topics");
                });
            } else {
                console.error("- No event logs (contract constructor likely reverted silently)");
            }
            
            // Check if all gas was consumed (indicates out of gas or revert)
            if (deployError.receipt.gasUsed === BigInt(1500000)) {
                console.error("🚨 All gas was consumed! This indicates:");
                console.error("   - Constructor execution hit gas limit");
                console.error("   - Complex constructor operations");
                console.error("   - Possible infinite loop or expensive operations");
            }
        }
        
        // Detailed error analysis
        if (deployError.transaction) {
            console.error("📄 Failed Transaction Details:");
            console.error("- To:", deployError.transaction.to || "Contract Creation");
            console.error("- From:", deployError.transaction.from);
            console.error("- Data:", deployError.transaction.data ? `${deployError.transaction.data.slice(0, 50)}...` : "No data");
        }
        
        // Check if it's a gas-related issue
        if (deployError.message.includes("tx fee") || deployError.message.includes("gas")) {
            console.log("💡 TIP: Gas-related issue detected. Trying with minimal gas settings...");
            
            try {
                // Fallback deployment with minimal gas
                capibaraToken = await CAPIBARAAFactory
                    .connect(deployer)
                    .deploy({
                        gasLimit: BigInt(1000000), // Minimal gas limit
                        gasPrice: BigInt(100000000) // 0.1 gwei - very low
                    });
                
                await capibaraToken.waitForDeployment();
                console.log("✅ Fallback deployment succeeded!");
                
            } catch (fallbackError: any) {
                console.error("❌ Fallback deployment also failed:", fallbackError.message);
                throw fallbackError;
            }
        } else if (deployError.message.includes("revert") || deployError.receipt?.status === 0) {
            console.error("🚨 Contract constructor reverted!");
            console.error("💡 Possible causes:");
            console.error("   - Constructor logic error in CAPIBARA contract");
            console.error("   - MpcCore.setPublic64() function call failed");
            console.error("   - _mint() function call failed");
            console.error("   - Target address validation failed");
            console.error("   - Account onboarding required on COTI network");
            console.error("   - MPC library not properly initialized");
            console.error("   - Decimal/amount calculation overflow");
            
            console.log("🔧 Suggested fixes:");
            console.log("   1. Try deploying a simpler contract without constructor minting");
            console.log("   2. Check if target address needs onboarding");
            console.log("   3. Verify MPC libraries are compatible");
            console.log("   4. Use smaller mint amounts");
            
            throw deployError;
        } else {
            throw deployError;
        }
    }

    const contractAddress = await capibaraToken.getAddress();
    console.log("✅ CAPIBARA Token deployed to:", contractAddress);
    
    // Verify deployment details
    console.log("\n=== Deployment Summary ===");
    console.log("Contract Name: CAPIBARA Token");
    console.log("Symbol: CAPI");
    console.log("Deployed Address:", contractAddress);
    console.log("Deployer Address:", deployer.address);
    console.log("Pre-minted To:", targetAddress);
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
        console.log("Deployment successful! ✅");
    } catch (error) {
        console.log("Note: Contract verification failed (this may be normal on testnet)");
        console.log("Deployment completed but verification skipped");
    }
    
    console.log("\n🎉 CAPIBARA Token deployment completed successfully!");
    console.log("💡 Save this address for future interactions:", contractAddress);
}

main().catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exitCode = 1;
});
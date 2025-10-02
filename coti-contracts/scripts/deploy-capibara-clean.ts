import hre from "hardhat";
import { setupAccounts } from "./utils/accounts";

async function main() {
    console.log("🚀 Starting CAPIBARA Token deployment...");
    console.log("📅 Timestamp:", new Date().toISOString());
    
    // Use setupAccounts - this is the CORRECT way for COTI
    console.log("⚙️  Setting up accounts (with onboarding)...");
    const [deployer] = await setupAccounts();
    
    console.log("✅ Deployer account:", deployer.address);
    console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
    
    // Get the contract factory
    console.log("\n🏭 Creating CAPIBARA contract factory...");
    const CAPIBARAFactory = await hre.ethers.getContractFactory("CAPIBARA");
    console.log("✅ Factory created");
    
    // Deploy the contract
    console.log("\n📤 Deploying CAPIBARA Token...");
    const capibaraToken = await CAPIBARAFactory
        .connect(deployer)
        .deploy();
    
    console.log("⏳ Waiting for deployment confirmation...");
    await capibaraToken.waitForDeployment();
    
    const contractAddress = await capibaraToken.getAddress();
    console.log("\n🎉 CAPIBARA Token deployed to:", contractAddress);
    
    // Call initialMint to mint 100,000 tokens to the specified address
    console.log("\n💎 Calling initialMint to mint 100,000 CAPI tokens...");
    console.log("   Recipient: 0x9b7384D697E5c9Fac557c035c0C0837a4221875c");
    
    const mintTx = await capibaraToken.initialMint();
    console.log("⏳ Waiting for mint transaction...");
    await mintTx.wait();
    console.log("✅ Initial mint completed!");
    
    // Verify the deployment
    console.log("\n📊 Deployment Summary:");
    console.log("==========================================");
    console.log("Contract Name: CAPIBARA Token");
    console.log("Symbol: CAPI");
    console.log("Decimals: 6");
    console.log("Contract Address:", contractAddress);
    console.log("Deployer Address:", deployer.address);
    console.log("Pre-minted To: 0x9b7384D697E5c9Fac557c035c0C0837a4221875c");
    console.log("Pre-minted Amount: 100,000 CAPI tokens");
    console.log("Maximum Supply: 10,000,000 CAPI tokens");
    console.log("Network: COTI Testnet");
    console.log("==========================================");
    
    try {
        const totalSupply = await capibaraToken.totalSupply();
        const contractOwner = await capibaraToken.owner();
        console.log("\n✅ Contract Verification:");
        console.log("   Total Supply:", totalSupply.toString());
        console.log("   Contract Owner:", contractOwner);
    } catch (error) {
        console.log("\n⚠️  Note: Contract verification skipped");
    }
    
    console.log("\n🎉 CAPIBARA Token deployment completed successfully!");
    console.log("💡 Save this address for future interactions:", contractAddress);
}

main().catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
});

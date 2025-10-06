import hre from "hardhat"
import { setupAccounts } from "./utils/accounts"

const CAPIBARA_ADDRESS = "0xcdbaA8A6afC275b3F5DfD3ee1916049C4213E885"

async function main() {
  console.log("🔍 CAPIBARA Token Balance Checker (Simple)")
  console.log("=".repeat(60))
  
  // Use setupAccounts which handles onboarding automatically
  const [account] = await setupAccounts()
  console.log(`✅ Connected account: ${account.address}`)
  console.log("")
  
  // Get CAPIBARA contract
  const CAPIBARA = await hre.ethers.getContractFactory("CAPIBARA", account)
  const capibara = CAPIBARA.attach(CAPIBARA_ADDRESS)
  
  // Get token info
  console.log("📝 Token Information:")
  const name = await capibara.name()
  const symbol = await capibara.symbol()
  const decimals = await capibara.decimals()
  const totalSupply = await capibara.totalSupply()
  
  console.log(`   Name: ${name}`)
  console.log(`   Symbol: ${symbol}`)
  console.log(`   Decimals: ${decimals}`)
  console.log(`   Total Supply: ${hre.ethers.formatUnits(totalSupply, 6)} ${symbol}`)
  console.log("")
  
  // Get balance using the public balanceOf that returns uint256
  console.log("📊 Account Balance:")
  console.log(`   Checking balance for: ${account.address}`)
  
  try {
    // Try the standard balanceOf(address) that returns decrypted uint256
    const balance = await (capibara as any)["balanceOf(address)"](account.address)
    console.log(`   Raw Balance (ctUint64): ${balance.toString()}`)
    
    // Try to decrypt using the account's decrypt functionality
    if (typeof account.decryptValue === 'function') {
      console.log("🔓 Attempting to decrypt...")
      const decrypted = await account.decryptValue(balance)
      console.log(`   ✅ Decrypted Balance: ${hre.ethers.formatUnits(decrypted, 6)} ${symbol}`)
    } else {
      console.log("   ⚠️  Note: Balance is encrypted (ctUint64 type)")
      console.log("   To decrypt, you need:")
      console.log("   1. Complete account onboarding")
      console.log("   2. Have the correct AES key in .env (USER_KEYS)")
      console.log("   3. Use COTI MetaMask Snap to view decrypted balance")
    }
    
  } catch (error: any) {
    console.error("❌ Error getting balance:", error.message)
  }
  
  console.log("")
  console.log("💡 Note: CAPIBARA is a Private ERC20 token")
  console.log("   Balances are encrypted on-chain for privacy")
  console.log("   Use COTI MetaMask Snap to view decrypted balances")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

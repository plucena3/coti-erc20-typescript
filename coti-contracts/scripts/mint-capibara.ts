import { ethers } from "hardhat"
import { setupAccounts } from "./utils/accounts"

const CAPIBARA_ADDRESS = "0xcdbaA8A6afC275b3F5DfD3ee1916049C4213E885"
const RECIPIENT_ADDRESS = "0xe45FC1a7D84e73C8c71EdF2814E7467F7C86a8A2"
const MINT_AMOUNT = 50_000 // 50,000 tokens (with 6 decimals = 50,000,000,000)

async function main() {
  console.log("🪙 Starting CAPIBARA Token Minting Process...")
  console.log("=".repeat(60))
  
  // Setup accounts using COTI's account management
  const [owner] = await setupAccounts()
  console.log(`✅ Connected with account: ${owner.address}`)
  console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(owner.address))} COTI`)
  console.log("")

  // Connect to deployed CAPIBARA contract
  console.log("📝 Connecting to CAPIBARA contract...")
  const CAPIBARA = await ethers.getContractFactory("CAPIBARA", owner)
  const capibara = CAPIBARA.attach(CAPIBARA_ADDRESS)
  console.log(`✅ Connected to CAPIBARA at: ${CAPIBARA_ADDRESS}`)
  console.log("")

  // Verify contract owner
  const contractOwner = await capibara.owner()
  console.log(`🔐 Contract Owner: ${contractOwner}`)
  
  if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
    console.error(`❌ Error: Connected account (${owner.address}) is not the contract owner (${contractOwner})`)
    console.error("Only the contract owner can mint tokens.")
    process.exit(1)
  }
  console.log("✅ Owner verification passed")
  console.log("")

  // Check current total supply
  console.log("📊 Checking current state...")
  const currentSupply = await capibara.totalSupply()
  console.log(`   Current Total Supply: ${currentSupply.toString()} (raw)`)
  console.log(`   Current Total Supply: ${ethers.formatUnits(currentSupply, 6)} CAPI`)
  console.log("")

  // Check recipient's current balance
  console.log(`📊 Checking recipient balance...`)
  const recipientBalanceBefore = await (capibara as any)["balanceOf(address)"](RECIPIENT_ADDRESS)
  console.log(`   Recipient (${RECIPIENT_ADDRESS}):`)
  console.log(`   Current Balance: ${recipientBalanceBefore.toString()} (raw)`)
  console.log(`   Current Balance: ${ethers.formatUnits(recipientBalanceBefore, 6)} CAPI`)
  console.log("")

  // Calculate mint amount with 6 decimals
  const mintAmountRaw = BigInt(MINT_AMOUNT) * BigInt(10 ** 6)
  console.log("🎯 Mint Parameters:")
  console.log(`   Recipient: ${RECIPIENT_ADDRESS}`)
  console.log(`   Amount: ${MINT_AMOUNT.toLocaleString()} CAPI`)
  console.log(`   Amount (raw): ${mintAmountRaw.toString()}`)
  console.log("")

  // Check if minting would exceed max supply
  const maxSupply = await capibara.MAX_SUPPLY()
  const newTotalSupply = currentSupply + mintAmountRaw
  console.log("🔍 Supply Check:")
  console.log(`   Max Supply: ${ethers.formatUnits(maxSupply, 18)} (note: uses 18 decimals for limit)`)
  console.log(`   New Total Supply: ${ethers.formatUnits(newTotalSupply, 6)} CAPI`)
  
  if (newTotalSupply > maxSupply) {
    console.error(`❌ Error: Minting ${MINT_AMOUNT} tokens would exceed maximum supply`)
    console.error(`   Current: ${ethers.formatUnits(currentSupply, 6)} CAPI`)
    console.error(`   Trying to mint: ${MINT_AMOUNT} CAPI`)
    console.error(`   Would result in: ${ethers.formatUnits(newTotalSupply, 6)} CAPI`)
    console.error(`   Maximum allowed: ${ethers.formatUnits(maxSupply, 18)} CAPI`)
    process.exit(1)
  }
  console.log("✅ Supply check passed")
  console.log("")

  // Execute mint transaction
  console.log("🚀 Executing mint transaction...")
  console.log("⏳ Please wait for transaction confirmation...")
  
  try {
    const tx = await capibara.mint(RECIPIENT_ADDRESS, mintAmountRaw)
    console.log(`📤 Transaction submitted: ${tx.hash}`)
    
    const receipt = await tx.wait()
    console.log(`✅ Transaction confirmed in block: ${receipt?.blockNumber}`)
    console.log(`   Gas used: ${receipt?.gasUsed.toString()}`)
    console.log("")

    // Verify the mint
    console.log("🔍 Verifying mint operation...")
    const newSupply = await capibara.totalSupply()
    const recipientBalanceAfter = await (capibara as any)["balanceOf(address)"](RECIPIENT_ADDRESS)
    
    console.log("📊 New State:")
    console.log(`   Total Supply: ${ethers.formatUnits(newSupply, 6)} CAPI`)
    console.log(`   Recipient Balance: ${ethers.formatUnits(recipientBalanceAfter, 6)} CAPI`)
    console.log("")
    
    // Calculate changes
    const supplyIncrease = newSupply - currentSupply
    const balanceIncrease = recipientBalanceAfter - recipientBalanceBefore
    
    console.log("📈 Changes:")
    console.log(`   Supply Increased: ${ethers.formatUnits(supplyIncrease, 6)} CAPI`)
    console.log(`   Recipient Balance Increased: ${ethers.formatUnits(balanceIncrease, 6)} CAPI`)
    console.log("")

    if (supplyIncrease === mintAmountRaw && balanceIncrease === mintAmountRaw) {
      console.log("✅ Mint verification successful!")
    } else {
      console.log("⚠️  Warning: Minted amounts don't match expected values")
    }
    
    console.log("")
    console.log("=".repeat(60))
    console.log("🎉 CAPIBARA Token Minting Completed Successfully!")
    console.log("=".repeat(60))
    console.log("")
    console.log("Summary:")
    console.log(`   Contract: ${CAPIBARA_ADDRESS}`)
    console.log(`   Recipient: ${RECIPIENT_ADDRESS}`)
    console.log(`   Minted: ${ethers.formatUnits(mintAmountRaw, 6)} CAPI`)
    console.log(`   Transaction: ${tx.hash}`)
    console.log(`   Block: ${receipt?.blockNumber}`)

  } catch (error: any) {
    console.error("")
    console.error("❌ Mint transaction failed!")
    console.error("=".repeat(60))
    
    if (error.message.includes("Only owner can mint")) {
      console.error("Error: Only the contract owner can mint tokens")
      console.error(`Connected account: ${owner.address}`)
      console.error(`Contract owner: ${contractOwner}`)
    } else if (error.message.includes("Exceeds maximum supply")) {
      console.error("Error: Minting would exceed maximum supply cap")
    } else if (error.message.includes("Cannot mint to zero address")) {
      console.error("Error: Cannot mint to the zero address")
    } else {
      console.error("Error details:", error.message)
    }
    
    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

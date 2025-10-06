import { ethers } from "ethers"
import * as CotiEthers from "@coti-io/coti-ethers"
import fs from "fs"
import path from "path"

// Configuration
const CAPIBARA_ADDRESS = "0xcdbaA8A6afC275b3F5DfD3ee1916049C4213E885"
const ACCOUNT_TO_CHECK = "0xe45FC1a7D84e73C8c71EdF2814E7467F7C86a8A2"
const ACCOUNT_PRIVATE_KEY = process.env.PRIVATE_KEY || ""
let AES_KEY = process.env.USER_KEYS || ""

// ABI fragments for balanceOf and decimals
const balanceOfFragment = {
  "inputs": [
    {
      "internalType": "address",
      "name": "account",
      "type": "address"
    }
  ],
  "name": "balanceOf",
  "outputs": [
    { 
      "internalType": "ctUint64",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view", 
  "type": "function"
}

const decimalsFragment = {
  "inputs": [],
  "name": "decimals",
  "outputs": [
    {
      "internalType": "uint8",
      "name": "",
      "type": "uint8"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}

const nameFragment = {
  "inputs": [],
  "name": "name",
  "outputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}

const symbolFragment = {
  "inputs": [],
  "name": "symbol",
  "outputs": [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}

const totalSupplyFragment = {
  "inputs": [],
  "name": "totalSupply",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}

const focusedAbi = [
  balanceOfFragment,
  decimalsFragment,
  nameFragment,
  symbolFragment,
  totalSupplyFragment
]

async function main() {
  console.log("🔍 CAPIBARA Token Balance Checker")
  console.log("=".repeat(60))
  console.log("")

  if (!ACCOUNT_PRIVATE_KEY) {
    console.error("❌ Error: PRIVATE_KEY not found in environment")
    process.exit(1)
  }

  try {
    // Setup COTI wallet 
    console.log("🔐 Setting up COTI wallet for decryption...")
    const provider = CotiEthers.getDefaultProvider(CotiEthers.CotiNetwork.Testnet)
    const cotiWallet = new CotiEthers.Wallet(ACCOUNT_PRIVATE_KEY, provider)
    
    // Initialize AES key if not provided
    if (!AES_KEY) {
      console.log("⚠️  No AES key found in environment")
      console.log("� Initializing AES key from account onboarding...")
      
      try {
        await cotiWallet.generateOrRecoverAes()
        const onboardInfo = cotiWallet.getUserOnboardInfo()
        AES_KEY = onboardInfo?.aesKey || ""
        
        if (AES_KEY) {
          console.log(`✅ AES key initialized: ${AES_KEY.substring(0, 10)}...`)
          
          // Save to .env file
          const envPath = path.join(__dirname, "../.env")
          let envContent = fs.readFileSync(envPath, "utf8")
          
          if (envContent.includes("USER_KEYS=")) {
            envContent = envContent.replace(/USER_KEYS=.*/, `USER_KEYS=${AES_KEY}`)
          } else {
            envContent += `\nUSER_KEYS=${AES_KEY}\n`
          }
          
          fs.writeFileSync(envPath, envContent)
          console.log("� AES key saved to .env file for future use")
        } else {
          throw new Error("Failed to retrieve AES key")
        }
      } catch (error: any) {
        console.error("❌ Failed to initialize AES key:", error.message)
        console.log("💡 Your account may need to be onboarded first")
        console.log("💡 Run: npx hardhat run scripts/onboard-account.ts --network coti-testnet")
        process.exit(1)
      }
    } else {
      // Check if the AES key looks valid (should be 64 hex chars without 0x prefix or 66 with 0x)
      const cleanAesKey = AES_KEY.startsWith("0x") ? AES_KEY.slice(2) : AES_KEY
      
      if (cleanAesKey.length !== 64) {
        console.log(`⚠️  AES key format seems incorrect (length: ${cleanAesKey.length}, expected: 64)`)
        console.log("🔑 Regenerating AES key from account onboarding...")
        
        try {
          await cotiWallet.generateOrRecoverAes()
          const onboardInfo = cotiWallet.getUserOnboardInfo()
          AES_KEY = onboardInfo?.aesKey || ""
          
          if (AES_KEY) {
            console.log(`✅ New AES key generated: ${AES_KEY.substring(0, 10)}...`)
            
            // Save to .env file
            const envPath = path.join(__dirname, "../.env")
            let envContent = fs.readFileSync(envPath, "utf8")
            
            if (envContent.includes("USER_KEYS=")) {
              envContent = envContent.replace(/USER_KEYS=.*/, `USER_KEYS=${AES_KEY}`)
            } else {
              envContent += `\nUSER_KEYS=${AES_KEY}\n`
            }
            
            fs.writeFileSync(envPath, envContent)
            console.log("💾 New AES key saved to .env file")
          }
        } catch (error: any) {
          console.error("❌ Failed to regenerate AES key:", error.message)
        }
      } else {
        console.log(`🔑 Using AES key from environment: ${AES_KEY.substring(0, 10)}...`)
        cotiWallet.setAesKey(AES_KEY)
      }
    }
    
    console.log(`✅ Connected wallet: ${cotiWallet.address}`)
    console.log(`📊 Checking balance for: ${ACCOUNT_TO_CHECK}`)
    console.log("")

    // Connect to CAPIBARA contract
    const capibaraToken = new ethers.Contract(CAPIBARA_ADDRESS, focusedAbi, cotiWallet)

    // Get token info
    console.log("📝 Token Information:")
    const tokenName = await capibaraToken.name()
    const tokenSymbol = await capibaraToken.symbol()
    const decimals = await capibaraToken.decimals()
    const totalSupply = await capibaraToken.totalSupply()
    
    console.log(`   Name: ${tokenName}`)
    console.log(`   Symbol: ${tokenSymbol}`)
    console.log(`   Decimals: ${decimals}`)
    console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, Number(decimals))} ${tokenSymbol}`)
    console.log("")

    // Get encrypted balance
    console.log("🔒 Fetching encrypted balance...")
    const ctBalance: bigint = await capibaraToken["balanceOf(address)"](ACCOUNT_TO_CHECK)
    console.log(`   Encrypted balance (ctUint64): ${ctBalance.toString()}`)
    console.log("")

    // Decrypt the balance
    console.log("🔓 Decrypting balance...")
    let decryptedBalance: bigint | undefined

    if (typeof (cotiWallet as any).decryptValue === 'function') {
      try {
        const decryptedResult = await (cotiWallet as any).decryptValue(ctBalance)
        
        if (typeof decryptedResult === 'bigint') {
          decryptedBalance = decryptedResult
        } else if (typeof decryptedResult === 'string' && decryptedResult.match(/^\d+$/)) {
          decryptedBalance = BigInt(decryptedResult)
        } else if (typeof decryptedResult === 'number') {
          decryptedBalance = BigInt(decryptedResult)
        } else {
          console.error("⚠️  Unexpected decryption result type:", typeof decryptedResult)
        }
        
      } catch (decryptError) {
        console.error("❌ Error during decryption:", decryptError)
        throw decryptError
      }
    } else {
      console.error("❌ Error: decryptValue method not found on COTI wallet")
      console.log("💡 Tip: Make sure you're using the correct version of @coti-io/coti-ethers")
      process.exit(1)
    }

    if (decryptedBalance === undefined) {
      throw new Error("Failed to decrypt balance")
    }

    // Display results
    console.log("")
    console.log("=".repeat(60))
    console.log("✅ BALANCE SUCCESSFULLY DECRYPTED")
    console.log("=".repeat(60))
    console.log("")
    console.log("📊 Account Balance Details:")
    console.log(`   Account: ${ACCOUNT_TO_CHECK}`)
    console.log(`   Token: ${tokenName} (${tokenSymbol})`)
    console.log(`   Contract: ${CAPIBARA_ADDRESS}`)
    console.log("")
    console.log(`   Raw Balance: ${decryptedBalance.toString()}`)
    console.log(`   Formatted Balance: ${ethers.formatUnits(decryptedBalance, Number(decimals))} ${tokenSymbol}`)
    console.log("")
    
    // Calculate percentage of total supply
    const percentOfSupply = (Number(decryptedBalance) / Number(totalSupply)) * 100
    console.log(`   Percentage of Total Supply: ${percentOfSupply.toFixed(4)}%`)
    console.log("")

  } catch (error) {
    console.error("")
    console.error("❌ Error occurred:")
    console.error("=".repeat(60))
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      if ((error as any).data) {
        console.error("Error data:", (error as any).data)
      }
    } else {
      console.error(error)
    }
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error)
    process.exit(1)
  })

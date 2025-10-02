import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from "dotenv"
dotenv.config()

// Force using JS compiler
process.env.HARDHAT_EXPERIMENTAL_ALLOW_NON_LOCAL_INSTALLATION = "true";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  defaultNetwork: "coti-testnet",
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000
          },
          metadata: {
            // do not include the metadata hash, since this is machine dependent
            // and we want all generated code to be deterministic
            // https://docs.soliditylang.org/en/v0.7.6/metadata.html
            bytecodeHash: 'none',
          },
        }
      }
    ]
  },
  // Force using Docker-based solc compiler
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  networks: {
    "coti-testnet": {
      url: "https://testnet.coti.io/rpc",
      chainId: 7082400,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 2100000,
      gasPrice: 1000000000, // 1 gwei
      timeout: 60000
    },
    "coti-mainnet": {
      url: "https://mainnet.coti.io/rpc",
      chainId: 2632500,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 2100000,
      gasPrice: 1000000000, // 1 gwei
      timeout: 60000
    },
  },
  mocha: {
    timeout: 100000000
  },
}

export default config;

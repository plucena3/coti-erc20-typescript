onboard requirements node 22 or better installed

```
npm install
cd coti-hardhat-template
npm install
cd ../coti-contracts/contracts/onboard
```

## create PRIVATE ERC-20 smart contract

@gemini 2.5
@coti-contracts @PrivateERC20 @PrivateERC20.md  @IPrivateERC20.md @PERCI.sol
Create a new contract called CAPIBARAPERCI.sol that inherits from @PrivateERC20 and has 100000 tokens minted to  0xb44E90707A29890942AE1D6595D6A52BA2Ba762e
CAPIBARA.sol must include mint and transfer implementations

## create deploy.ts

@coti-hardhat-template
Create a script similar to **@deploy.ts** to deploy @CAPIBARA.sol

```
npm install
cd coti-hardhat-template
npm install
cd coti-contracts/contracts/onboard
npx hardhat compile
npx hardhat run scripts/deploy.ts --network coti-testnet
```

SHOW ENCRYPTED VALUE ON METAMASK



## mint and show balance

@gemini 2.5

using **@coti-ethers** write a program that invokes  function balanceOf(address account) of **@CAPIBARA.sol**  displays the ballace of contract deployed at  coti.testnet at 0x4D7378BABbcc9B5Ccb64EF6d02D31B8035520f5A


deploying smart contracts using hardhat

setup

```
npx hardhat run scripts/cotiMint.ts --network coti-testnet
# SHOW ENCRYPTED VALUE ON METAMASK CHANGES
npx hardhat run scripts/getBalance.ts --network coti-testnet
# SHOW DECRYPTED VALUE 
npx hardhat run scripts/cotiMint.ts --network coti-testnet
npx hardhat run scripts/getBalance.ts --network coti-testnet
# SHOW DECRYPTED VALUE
```

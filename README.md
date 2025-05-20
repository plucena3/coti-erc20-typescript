onboard requirements node 22 or better installed
having a Testnet COTI account onboarded

```
npm install
cd coti-hardhat-template
npm install
cd ../coti-contracts/contracts/onboard
```

## create PRIVATE ERC-20 smart contract

@gemini 2.5
@coti-contracts @PrivateERC20 @PrivateERC20.md  @IPrivateERC20.md @PERCI.sol
Create a new contract called CAPIBARA.sol that inherits from @PrivateERC20 and has 100000 tokens minted to  0xfAF7e0962B79675cd046C4c0bF41beEb27FCc5C8  **#change it to use your ADDRESS **
CAPIBARA.sol must include totalsuppl,  mint and transfer implementations

## compile smart contract

```
cd coti-contracts
npx hardhat compile
```

> Warning: Function state mutability can be restricted to pure
> --> contracts/utils/mpc/MpcCore.sol:1043:5:
> |
> 1043 |     function _splitUint128(uint128 number) private returns (uint64, uint64) {
> |     ^ (Relevant source part starts here and spans across multiple lines).
>
> Warning: Function state mutability can be restricted to pure
> --> contracts/utils/mpc/MpcCore.sol:1500:5:
> |
> 1500 |     function _splitUint256(uint256 number) private returns (uint128, uint128) {
> |     ^ (Relevant source part starts here and spans across multiple lines).
>
> Generating typings for: 1 artifacts in dir: typechain-types for target: ethers-v6
> Successfully generated 68 typings!
> Compiled 1 Solidity file successfully (evm target: paris).

## create deploy.ts

@gemini
Create a script similar to **@deploy.ts**   to deploy   **@CAPIBARA.sol** **@CAPIBARA.json**Create a script similar to **@deploy.ts** to deploy @CAPIBARA.sol

```
npx hardhat run scripts/deploy-capibara.ts --network coti-testnet
```

> CAPIBARA Token deployed to: 0xa7ca50518d4D535bBF239CcbeCCf1CF645bdB692

SHOW ENCRYPTED VALUE ON METAMASK

## show balance

@gemini 2.5

using **@coti-ethers** write a hardhat script similar to  **@getBalance.ts**  that invokes  function balanceOf(address account) of \*\***@CAPIBARA.sol**\*\*  displays the ballace of contract deployed at  coti.testnet at 0xa7ca50518d4D535bBF239CcbeCCf1CF645bdB692using **@coti-ethers** write a program similar to that invokes  function balanceOf(address account) of **@CAPIBARA.sol**  displays the ballace of contract deployed at  coti.testnet at 0xa7ca50518d4D535bBF239CcbeCCf1CF645bdB692

add  private key  and AES info

```
const ACCOUNT_PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE'; 
// Ensure this private key is correct for decryption to work.

// --- IMPORTANT: Replace with your AES encryption/decryption key ---
const AES_KEY = 'YOUR_AES_KEY_HERE';

```

besides connecting to smart contract and invking the balanceOf, inherited from PrivateToken.sol comment use of coti-ethers

```
    if (typeof (cotiWallet as any).decryptValue === 'function') {

```

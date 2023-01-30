![W3DNA](logo.svg "W3DNA")

# Web3 Domain Name Accounts Contracts
## How to deploy contracts
### Investing part
1. Run ```npx truffle exec scripts/investing/1_deploy_contracts.js --network [networkname]```  
This command will return the list of parameters used for verification and subsequent scripts. I.E.  
```Configuration params: --market 0x929153acb6FbFEcd180E04026698aa8eF3d3c6E5 --pricing 0x5766ae380229B1628076280808ada65a375A363E --nft 0x8e49d4B11A0A33D2c0D13F2C65D8B5F120819871 --dividends 0xa031e45C46A746c7af8386298a9705FC8FaA9dF6 --usdt 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd --busd 0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee```  
```Verification params: InvestNFTMarket@0x929153acb6FbFEcd180E04026698aa8eF3d3c6E5 InvestNFTMarketPricePolicy@0x5766ae380229B1628076280808ada65a375A363E InvestNFT@0x8e49d4B11A0A33D2c0D13F2C65D8B5F120819871 DividendManager@0xa031e45C46A746c7af8386298a9705FC8FaA9dF6```
2. Run ```npx truffle run verify [verification params] --network [networkname]```
3. Run ```npx truffle exec scripts/investing/2_configure_contracts.js [configuration params] --network [networkname]```  
  You will also need to add the following params: ```--busd [BUSD address] --usdt [USDT address] --devs [devs address] --team [team address] --fund [fund address]```
### BNS part
1. Run ```npx truffle exec scripts/bns/1_deploy_contracts.js --network [networkname]```
2. Run ```npx truffle run verify [verification params] --network [networkname]``` 
3. Run ```npx truffle exec scripts/bns/2_configure_contracts.js [configuration params] --network [networkname]```
  You will also need to add the following params: ```--dividends [DividendManager address]```

## Test network configuration (BSC Testnet)
### Main BNS contracts
* [Market](https://testnet.bscscan.com/address/0xaA7428586292D9b5F8B5b44Ec834f27565A874C6)
* [Pricing Controller](https://testnet.bscscan.com/address/0x189f2577CAe1C057bfC3b27d7D55F5b7BB4766ed)
* [Naming Controller](https://testnet.bscscan.com/address/0x25B0375fdd0e116E65c34cE113F879B5506747Ec)
* [NFT](https://testnet.bscscan.com/token/0xA7A92eA6AF139259258C01cD7019cD64D9c243e8)
* [Storage](https://testnet.bscscan.com/address/0x8BC9F0CB98A311075683AAB5AAB1E2BE00122A58)
* [Repository](https://testnet.bscscan.com/address/0x1cC325740CA198d7bAC9ed67a50e4077147be0Ad)
* [Token](https://testnet.bscscan.com/address/0x222fB2C172e13B2EA032f0Eb0851574E7687dcf2)
### Third-party contracts used
* [USDT](https://testnet.bscscan.com/token/0x337610d27c682E347C9cD60BD4b3b107C9d34dDd)
* [BUSD](https://testnet.bscscan.com/token/0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee)
### Investing
* [InvestNFTMarket](https://testnet.bscscan.com/address/0x929153acb6FbFEcd180E04026698aa8eF3d3c6E5#code)
* [InvestNFTMarketPricePolicy](https://testnet.bscscan.com/address/0x5766ae380229B1628076280808ada65a375A363E#code)
* [InvestNFT](https://testnet.bscscan.com/address/0x8e49d4B11A0A33D2c0D13F2C65D8B5F120819871#code)
* [DividendManager](https://testnet.bscscan.com/address/0xa031e45C46A746c7af8386298a9705FC8FaA9dF6#code)

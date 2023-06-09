import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const BUYER_KEY = process.env.BUYER_KEY || "";
const SELLER_PRIVATE_KEY = process.env.SELLER_PRIVATE_KEY || "";
const INSPECTOR_PRIVATE_KEY = process.env.INSPECTOR_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [BUYER_KEY, SELLER_PRIVATE_KEY, INSPECTOR_PRIVATE_KEY],
      chainId: 5
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [BUYER_KEY, SELLER_PRIVATE_KEY, INSPECTOR_PRIVATE_KEY],
      chainId: 11155111
    },
    localhost : {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};

export default config;
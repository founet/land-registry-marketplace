// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { run } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const verify = async(contractAddress, args) => {
  try {
      await run("verify:verify", {
          address: contractAddress,
          constructorsArguments: args
      })
  } 
  catch(e) {
      if(e.message.toLowerCase().includes("already verified")) {
          console.log("Already verified")
      } else {
          console.log(e.message)
      }
  }
}

async function main() {
  // Setup accounts
  const [, , inspector] = await ethers.getSigners()

  // Deploy Land
  const Land = await ethers.getContractFactory('Land')
  const land = await Land.deploy()
  await land.deployed()

  // Deploy LandMarketplace
  const LandMarketplace = await ethers.getContractFactory('LandMarketplace')
  const landMarketplace = await LandMarketplace.deploy(
    land.address,
    inspector.address
  )
  await landMarketplace.deployed()

  console.log(`Deployed Land Contract at: ${land.address}`)
  console.log(`Deployed LandMarketplace Contract at: ${landMarketplace.address}`)

  if (network.name === "goerli") {
    console.log("Verifying smart contract")
    await land.deployTransaction.wait()
    await verify(land.address, [])
    await landMarketplace.deployTransaction.wait()
    await verify(landMarketplace.address, [land.address, inspector.address])
  }

  console.log(`Finished.`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

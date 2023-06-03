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
  const [buyer, seller, inspector] = await ethers.getSigners()

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
  console.log(`Minting 3 parcels...\n`)

  if (network.name !== "localhost") {
    console.log("Verifying smart contract")
    await land.deployTransaction.wait(6)
    await verify(land.address, [])
    await landMarketplace.deployTransaction.wait(6)
    await verify(landMarketplace.address, [])
  }

  for (let i = 0; i < 3; i++) {
    const transaction = await land.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`)
    await transaction.wait()
    const transaction1 = await landMarketplace.connect(seller).addSeller(i+1)
    await transaction1.wait()
  }

  console.log(`Deployed LandMarketplace Contract at: ${landMarketplace.address}`)
  console.log(`Listing 3 parcels...\n`)

  for (let i = 0; i < 3; i++) {
    // Approve parcels...
    let transaction = await land.connect(seller).approve(landMarketplace.address, i + 1)
    await transaction.wait()
  }

  // Listing parcels...
  transaction = await landMarketplace.connect(seller).list(1, tokens(0.001))
  await transaction.wait()

  transaction = await landMarketplace.connect(seller).list(2, tokens(0.002))
  await transaction.wait()

  transaction = await landMarketplace.connect(seller).list(3, tokens(0.003))
  await transaction.wait()

  console.log(`Finished.`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

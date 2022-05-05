const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {

  [owner, alice, bob, cindy, domino, erik, fred, george, julias, mike] = await ethers.getSigners();

  // We get the contract to deploy
  const PenerArt = await hre.ethers.getContractFactory("PenerArt");
  const peners = await PenerArt.deploy();

  await peners.deployed();

  console.log("PenerArt deployed to:", peners.address);

  const saleSeason1 = {
    saleEndSupply: 333,
    pricePerToken: parseUnits(0.02, 18),
    maxTokenPerWallet: 3,
    charityPercentageUnit: 1000 //10%
  }
  tx = await peners.connect(owner).setupSaleInfo(1, saleSeason1)
  await tx.wait()

  tx = await peners.connect(owner).flipMintState()
  await tx.wait()

  console.log("Sale Initiated successfully:", peners.address);
}



// Converts token units to smallest individual token unit, eg: 1 DAI = 10^18 units 
const parseUnits = (amount, units) => {
  return ethers.utils.parseUnits(amount.toString(), units);
}

// Converts token units from smallest individual unit to token unit, opposite of parseUnits
const formatUnits = (amount, units) => {
  return ethers.utils.formatUnits(amount.toString(), units);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

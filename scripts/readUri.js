const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {

    [owner, alice, bob, cindy, domino, erik, fred, george, julias, mike] = await ethers.getSigners();

    const peners = await ethers.getContractAt("PenerArt", "0x9459B00FAb7859B316f63C3eb5fdD8B9d18BB3F7")   // Should be replaced with mainnet NFT address

    console.log("PenerArt deployed to:", peners.address);

    tokenURI = await peners.tokenURI(3)
        console.log("tokenURI", tokenURI);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

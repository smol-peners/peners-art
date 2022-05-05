const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {

    [owner, alice, bob, cindy, domino, erik, fred, george, julias, mike] = await ethers.getSigners();

    const peners = await ethers.getContractAt("PenerArt", "0x9459B00FAb7859B316f63C3eb5fdD8B9d18BB3F7")   // Should be replaced with mainnet NFT address

    console.log("PenerArt deployed to:", peners.address);

    tx = await peners.connect(owner).mintPublic(2, { value: parseUnits(2 * 0.02, 18) })
    await tx.wait()

    // balance = await peners.balanceOf(alice.address)

    // console.log("Minted successfully, Alice has ", balance);
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

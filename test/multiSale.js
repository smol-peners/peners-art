const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs')
const { keccak256 } = ethers.utils

// const { BN, time, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

describe("Peners Art", function () {
    // Smart Contract Variables
    let peners

    // Utilities

    // General Variables
    let tx, balance, totalSupply, whitelisted, notwhitelisted

    before(async () => {

        [owner, alice, bob, cindy, domino, erik, fred, george, julias, mike] = await ethers.getSigners();

        // Deploy DaddyFactory
        const PenerArt = await ethers.getContractFactory("PenerArt");
        peners = await PenerArt.connect(owner).deploy();
        await peners.deployed();

        console.log("PenerArt deployed to:", peners.address);

        
    });

    const setupSale = async (saleIndex, saleClass) => {
        tx = await peners.connect(owner).setupSaleInfo(saleIndex, saleClass)
        await tx.wait()

    }

    it("Initialize Sale Season 1", async function () {

        // Sale Season 1
        const saleSeason1 = {
            saleEndSupply: 10,
            pricePerToken: parseUnits(0.5, 18),
            maxTokenPerWallet: 3,
            charityPercentageUnit: 1000 //10%
        }

        tx = await peners.connect(owner).setupSaleInfo(1, saleSeason1)
        await tx.wait()

        tx = await peners.connect(owner).flipMintState()
        await tx.wait()

    });
    it("Minting Season 1", async function () {
        tx = await peners.connect(alice).mintPublic(3, { value: parseUnits(3 * 0.5, 18) })
        await tx.wait()
        
        whitelisted = [bob, cindy, domino]
        notwhitelisted = [erik, fred, george]

        const leaves = whitelisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const merkleRoot = tree.getHexRoot()

        tx = await peners.connect(owner).setSaleMerkleRoot(1, merkleRoot)
        await tx.wait()

        const bobProof = tree.getHexProof(keccak256(bob.address))
        const cindyProof = tree.getHexProof(keccak256(cindy.address))

        tx = await peners.connect(bob).mintWhitelist(3, bobProof, { value: parseUnits(3 * 0.5, 18) })
        await tx.wait()

        tx = await peners.connect(cindy).mintWhitelist(3, cindyProof, { value: parseUnits(3 * 0.5, 18) })
        await tx.wait()

        tx = await peners.connect(owner).reserve(1)
        await tx.wait()

        tx = await peners.connect(owner).withdraw();
        await tx.wait();

        await expect(await peners.totalSupply()).to.equal(10);
        
        await expect(peners.connect(alice).mintPublic(3, { value: parseUnits(3 * 0.5, 18) }))
        .to.be.revertedWith("Purchase would exceed max tokens");

    });
    it("Initialize Sale Season 2", async function () {

        // Sale Season 2
        const saleSeason2 = {
            saleEndSupply: 20,
            pricePerToken: parseUnits(0.5, 18),
            maxTokenPerWallet: 3,
            charityPercentageUnit: 1000 //10%
        }

        tx = await peners.connect(owner).setupSaleInfo(2, saleSeason2)
        await tx.wait()

    });
    it("Minting Season 2", async function () {
        tx = await peners.connect(alice).mintPublic(3, { value: parseUnits(3 * 0.5, 18) })
        await tx.wait()
        
        whitelisted = [bob, cindy, domino]
        notwhitelisted = [erik, fred, george]

        const leaves = whitelisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const merkleRoot = tree.getHexRoot()

        tx = await peners.connect(owner).setSaleMerkleRoot(2, merkleRoot)
        await tx.wait()

        const bobProof = tree.getHexProof(keccak256(bob.address))
        const cindyProof = tree.getHexProof(keccak256(cindy.address))

        tx = await peners.connect(bob).mintWhitelist(3, bobProof, { value: parseUnits(3 * 0.5, 18) })
        await tx.wait()

        tx = await peners.connect(cindy).mintWhitelist(3, cindyProof, { value: parseUnits(3 * 0.5, 18) })
        await tx.wait()

        tx = await peners.connect(owner).reserve(1)
        await tx.wait()

        tx = await peners.connect(owner).withdraw();
        await tx.wait();

        await expect(await peners.totalSupply()).to.equal(20);
        
        await expect(peners.connect(alice).mintPublic(3, { value: parseUnits(3 * 0.5, 18) }))
        .to.be.revertedWith("Purchase would exceed max tokens");

    });

});



// Lsit of Helper functions
// Zero Address
const zeroAddress = "0x0000000000000000000000000000000000000000"
const approveMAX = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
// Converts checksum
const address = (address) => {
    return ethers.utils.getAddress(address);
}

// Converts token units to smallest individual token unit, eg: 1 DAI = 10^18 units 
const parseUnits = (amount, units) => {
    return ethers.utils.parseUnits(amount.toString(), units);
}

// Converts token units from smallest individual unit to token unit, opposite of parseUnits
const formatUnits = (amount, units) => {
    return ethers.utils.formatUnits(amount.toString(), units);
}

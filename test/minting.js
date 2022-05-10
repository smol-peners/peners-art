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
    let tx, balance, totalSupply

    before(async () => {

        [owner, alice, bob, cindy, domino, erik, fred, george, julias, mike] = await ethers.getSigners();

        // Deploy DaddyFactory
        const PenerArt = await ethers.getContractFactory("PenerArt");
        peners = await PenerArt.connect(owner).deploy();
        await peners.deployed();

        console.log("PenerArt deployed to:", peners.address);
    });

    it("Initialize Sale", async function () {
        // Sale Class Variable
        const saleSeason1 = {
            saleEndSupply: 10,
            pricePerToken: parseUnits(0.02, 18),
            maxTokenPerWallet: 3,
            charityPercentageUnit: 1000 //10%
        }
        tx = await peners.connect(owner).setupSaleInfo(1, saleSeason1)
        await tx.wait()

        tx = await peners.connect(owner).setupSaleInfo(1, saleSeason1)
        await tx.wait()
        
        await expect(peners.connect(alice).mintPener(2, []))
        .to.be.revertedWith("Mint is not active");

        tx = await peners.connect(owner).flipMintState()
        await tx.wait()
    });
    it("Public Minting", async function () {
        
        // Invalid Ether Amount
        await expect(peners.connect(alice).mintPener(2, [], { value: parseUnits(2 * 0.4, 18) }))
        .to.be.revertedWith("Invalid amount");

        tx = await peners.connect(alice).mintPener(2, [], { value: parseUnits(2 * 0.02, 18) })
        await tx.wait()

        await expect(await peners.balanceOf(alice.address)).to.equal(2);
        
        await expect(peners.connect(alice).mintPener(2, [], { value: parseUnits(2 * 0.02, 18) }))
        .to.be.revertedWith("You went over max tokens per transaction");
        
        tx = await peners.connect(alice).mintPener(1, [], { value: parseUnits(1 * 0.02, 18) })
        await tx.wait()
        
        await expect(await peners.balanceOf(alice.address)).to.equal(3);

        balance = await peners.balanceOf(alice.address)

        // Enumerating all tokens for Alice
        for (let index = 0; index < balance.toNumber(); index++) {
            tokenOfOwnerByIndex = await peners.tokenOfOwnerByIndex(alice.address, index);
            console.log("tokenOfOwnerByIndex Alice", tokenOfOwnerByIndex);
        }
        
        await expect(await peners.totalSupply()).to.equal(3);
        await expect(await peners.tokenIds()).to.equal(3);

    });
    it("Whitelist Minting", async function () {
        
        const whitelisted = [bob, cindy, domino]
        const notwhitelisted = [erik, fred, george]

        const leaves = whitelisted.map(account => keccak256(account.address))
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        const merkleRoot = tree.getHexRoot()

        tx = await peners.connect(owner).setSaleMerkleRoot(1, merkleRoot)
        await tx.wait()

        tx = await peners.connect(owner).flipWhiteListMintState()
        await tx.wait()

        const bobProof = tree.getHexProof(keccak256(bob.address))
        const fredProof = tree.getHexProof(keccak256(fred.address))
        const cindyProof = tree.getHexProof(keccak256(cindy.address))

        await expect(peners.connect(bob).mintPener(3, fredProof, { value: parseUnits(3 * 0.02, 18) }))
        .to.be.revertedWith("Invalid Proof")

        await expect(peners.connect(fred).mintPener(3, fredProof, { value: parseUnits(3 * 0.02, 18) }))
        .to.be.revertedWith("Invalid Proof")

        await expect(peners.connect(fred).mintPener(3, bobProof, { value: parseUnits(3 * 0.02, 18) }))
        .to.be.revertedWith("Invalid Proof")

        tx = await peners.connect(bob).mintPener(3, bobProof, { value: parseUnits(3 * 0.02, 18) })
        await tx.wait()

        tx = await peners.connect(cindy).mintPener(3, cindyProof, { value: parseUnits(3 * 0.02, 18) })
        await tx.wait()
        
        await expect(await peners.balanceOf(bob.address)).to.equal(3);
        
        await expect(peners.connect(bob).mintPener(1, [], { value: parseUnits(1 * 0.02, 18) }))
        .to.be.revertedWith("You went over max tokens per transaction");
        
        await expect(await peners.totalSupply()).to.equal(9);
        
    });
    it("Admin Withdrawl", async function() {
        expect(peners.connect(owner).withdraw())
        .to.be.revertedWith("Withdrawl can be made after the end of each sale");
        
        // Reserved NFT
        tx = await peners.connect(owner).reserve(1)
        await tx.wait()

        tx = await peners.connect(owner).withdraw();
        await tx.wait();

        console.log("Admin balance", formatUnits(await ethers.provider.getBalance(owner.address)));
        console.log("Charity balance", formatUnits(await ethers.provider.getBalance('0x5db8Bb85D6065f95350d8AE3934D72Ad0aB3Ae7E')));

    })
    it("Token uri", async function() {  
         
        tx = await peners.connect(owner).setBaseURI("https//smolpeners.metadata/");
        await tx.wait();

        // Reserved NFT
        tokenURI = await peners.tokenURI(5)
        console.log("tokenURI", tokenURI);

    })
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


// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract PenerArt is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {

    struct SaleClass {
        uint256 saleEndSupply;              // TotalSupply at the end of each sale 
        uint256 pricePerToken;              // Price per Token
        uint256 maxTokenPerWallet;          // Tokens per wallet
        uint256 charityPercentageUnit;      // 10% = 1000 units
    }

    uint256 public tokenIds;
    string private _baseURIextended;
    uint256 public currentSaleIndex;        // Tracks current Sale
    address public charityWallet = 0xA5D82471A12FBd6fD1412e5eb5850d9d6aC5d525;
    bool public mintIsActive;
    address public operator;

    mapping (uint256 => SaleClass) public saleInfo;
    mapping (address => mapping (uint256 =>uint256 )) public tokensClaimedPerSale;      // Tokens claimed per user per sale
    mapping (uint256 => bytes32) public saleWhiteListMerkleRoot;    // Whitelist merkle root for each sale


    constructor() ERC721("lomS srneP Art", "SRENEP") {
        operator = msg.sender;
    }

    receive() external payable {
        revert();
    }

    modifier onlyOperator {
      require(msg.sender == operator);
      _;
    }

    function setupSaleInfo(
        uint256 _saleIndex,
        SaleClass calldata _saleInfo
    ) external {
        require(msg.sender == owner() || msg.sender == operator, "Not Authenticated");
        saleInfo[_saleIndex] = _saleInfo;
        currentSaleIndex = _saleIndex;
    }

    function flipMintState() external {
        require(msg.sender == owner() || msg.sender == operator, "Not Authenticated");
        mintIsActive = !mintIsActive;
    }

     /**
     * @notice sets Merkle Root for whitelisted addresses
     */
    function setSaleMerkleRoot(uint256 _saleIndex, bytes32 _saleMerkleRoot) public {
        require(msg.sender == owner() || msg.sender == operator, "Not Authenticated");
        saleWhiteListMerkleRoot[_saleIndex] = _saleMerkleRoot;
    }

     /**
     * @notice sets Merkle Root for whitelisted addresses
     */
    function setOperator(address newOperator) public {
        require(msg.sender == owner() || msg.sender == operator, "Not Authenticated");
        operator = newOperator;
    }

    /**
     *  @notice public mint function
     */
    function mintPublic(uint numberOfTokens) public payable nonReentrant {
        SaleClass memory currentSale = saleInfo[currentSaleIndex];

        require(mintIsActive, "Mint is not active");
        require(totalSupply() + numberOfTokens <= currentSale.saleEndSupply, "Purchase would exceed max tokens");
        require(msg.value == currentSale.pricePerToken * numberOfTokens, "Invalid amount");
        require(tokensClaimedPerSale[msg.sender][currentSaleIndex] + numberOfTokens <= currentSale.maxTokenPerWallet, "You went over max tokens per transaction");

        for (uint256 index = 0; index < numberOfTokens; index++) {
            tokenIds++;
            _safeMint(msg.sender, tokenIds);
        }

        tokensClaimedPerSale[msg.sender][currentSaleIndex] += numberOfTokens;
    }

    /**
     * @notice Presale wallet list mint 
     */
    function mintWhitelist(uint256 numberOfTokens, bytes32[] calldata _merkleProof) public payable nonReentrant{
        SaleClass memory currentSale = saleInfo[currentSaleIndex];

        require(mintIsActive, "Mint is not active");
        require(totalSupply() + numberOfTokens <= currentSale.saleEndSupply, "Purchase would exceed max tokens");
        require(msg.value == currentSale.pricePerToken * numberOfTokens, "Invalid amount");
        require(tokensClaimedPerSale[msg.sender][currentSaleIndex] + numberOfTokens <= currentSale.maxTokenPerWallet, "You went over max tokens per transaction");


        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, saleWhiteListMerkleRoot[currentSaleIndex], leaf), "Invalid Proof");

        for (uint256 index = 0; index < numberOfTokens; index++) {
            tokenIds++;
            _safeMint(msg.sender, tokenIds);
        }

        tokensClaimedPerSale[msg.sender][currentSaleIndex] += numberOfTokens;
    }

    /**
     * @notice Reserve token by admin
     */
    function reserve(uint256 numberOfTokens) public onlyOwner {
       for (uint256 index = 0; index < numberOfTokens; index++) {
            tokenIds++;
            _safeMint(msg.sender, tokenIds);
        }
    }

    /**
     * @notice Admin Withdraw
     */
    function withdraw() public onlyOwner nonReentrant {
        SaleClass memory currentSale = saleInfo[currentSaleIndex];

        uint balance = address(this).balance;
        require(balance > 0, "Nothing to pay out");
        require(totalSupply() >= currentSale.saleEndSupply, "Withdrawl can be made after the end of each sale");

        uint256 charityShare = balance * currentSale.charityPercentageUnit/ 10000;

        if(charityShare > 0){
            (bool sent1, ) = payable(charityWallet).call{value: charityShare}("");
            require(sent1, "Failed to send Ether");
        }

        (bool sent2, ) = payable(owner()).call{value: (balance - charityShare)}("");
        require(sent2, "Failed to send Ether");
    }

    function setBaseURI(string memory baseURI_) external {
        require(msg.sender == owner() || msg.sender == operator, "Not Authenticated");
        _baseURIextended = baseURI_;
    }
    
    /// @notice Fetches all sale information
    function saleInformation(uint256 _saleIndex)
        public
        view
        returns (SaleClass memory saleClassArray)
    {
        return saleInfo[_saleIndex];
    }


    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

   
    /** OVERRIDES */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}




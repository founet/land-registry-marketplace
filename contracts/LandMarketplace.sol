//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './Land.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract LandMarketplace is Ownable {
    address public nftAddress;
    address public inspector;

    modifier onlyBuyer(uint256 _nftID) {
        require((msg.sender != seller[_nftID]) && (msg.sender != inspector), "Only buyer can call this method");
        _;
    }

    modifier onlySeller(uint256 _nftID) {
        require(msg.sender == seller[_nftID], "Only seller can call this method");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => address) public seller;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => uint256) public deposit;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    constructor(
        address _nftAddress,
        address _inspector
    ) {
        nftAddress = _nftAddress;
        inspector = _inspector;
    }

    function list(
        uint256 _nftID,
        uint256 _purchasePrice
    ) public payable onlySeller(_nftID) {
        // Transfer NFT from seller to this contract
        Land(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
    }

    // Update Inspection Status (only inspector)
    function updateInspectionStatus(uint256 _nftID, bool _passed)
        public
        onlyInspector
    {
        inspectionPassed[_nftID] = _passed;
    }

    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(msg.value >= purchasePrice[_nftID]);
        buyer[_nftID] = msg.sender;
        deposit[_nftID] = msg.value;
    }

    // Approve Sale
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }

    // Finalize Sale
    // -> Require inspection status
    // -> Require sale to be authorized
    // -> Require funds to be correct amount
    // -> Transfer NFT to buyer
    // -> Transfer Funds to Seller
    function finalizeSale(uint256 _nftID) public {
        require(inspectionPassed[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller[_nftID]]);
        require(deposit[_nftID] >= purchasePrice[_nftID]);

        isListed[_nftID] = false;

        (bool success, ) = payable(seller[_nftID]).call{value: deposit[_nftID]}(
            ""
        );
        require(success);

        Land(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    // Cancel Sale (handle earnest deposit)
    // -> if inspection status is not approved, then refund, otherwise send to seller
    function cancelSale(uint256 _nftID) public {
        if (inspectionPassed[_nftID] == false) {
            payable(buyer[_nftID]).transfer(deposit[_nftID]);
        } else {
            payable(seller[_nftID]).transfer(deposit[_nftID]);
        }
    }

    receive() external payable {}

    fallback() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function addSeller(uint256 _nftID) public {
        seller[_nftID] = msg.sender;
    }
}

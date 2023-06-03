const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('LandMarketplace', () => {
    let buyer, seller, inspector
    let land, landMarketplace

    beforeEach(async () => {
        // Setup accounts
        [buyer, seller, inspector] = await ethers.getSigners()

        // Deploy Real Estate
        const Land = await ethers.getContractFactory('Land')
        land = await Land.deploy()

        // Mint 
        let transaction = await land.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
        await transaction.wait()

        // Deploy LandMarketplace
        const LandMarketplace = await ethers.getContractFactory('LandMarketplace')
        landMarketplace = await LandMarketplace.deploy(
            land.address,
            seller.address,
            inspector.address
        )

        // Approve Property
        transaction = await land.connect(seller).approve(landMarketplace.address, 1)
        await transaction.wait()

        // List Property
        transaction = await landMarketplace.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
    })

    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await landMarketplace.nftAddress()
            expect(result).to.be.equal(land.address)
        })

        it('Returns seller', async () => {
            const result = await landMarketplace.seller()
            expect(result).to.be.equal(seller.address)
        })

        it('Returns inspector', async () => {
            const result = await landMarketplace.inspector()
            expect(result).to.be.equal(inspector.address)
        })
    })

    describe('Listing', () => {
        it('Updates as listed', async () => {
            const result = await landMarketplace.isListed(1)
            expect(result).to.be.equal(true)
        })

        it('Returns buyer', async () => {
            const result = await landMarketplace.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })

        it('Returns purchase price', async () => {
            const result = await landMarketplace.purchasePrice(1)
            expect(result).to.be.equal(tokens(10))
        })

        it('Returns landMarketplace amount', async () => {
            const result = await landMarketplace.escrowAmount(1)
            expect(result).to.be.equal(tokens(5))
        })

        it('Updates ownership', async () => {
            expect(await land.ownerOf(1)).to.be.equal(landMarketplace.address)
        })
    })

    describe('Deposits', () => {
        beforeEach(async () => {
            const transaction = await landMarketplace.connect(buyer).depositEarnest(1, { value: tokens(5) })
            await transaction.wait()
        })

        it('Updates contract balance', async () => {
            const result = await landMarketplace.getBalance()
            expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Inspection', () => {
        beforeEach(async () => {
            const transaction = await landMarketplace.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
        })

        it('Updates inspection status', async () => {
            const result = await landMarketplace.inspectionPassed(1)
            expect(result).to.be.equal(true)
        })
    })

    describe('Approval', () => {
        beforeEach(async () => {
            let transaction = await landMarketplace.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await landMarketplace.connect(seller).approveSale(1)
            await transaction.wait()
        })

        it('Updates approval status', async () => {
            expect(await landMarketplace.approval(1, buyer.address)).to.be.equal(true)
            expect(await landMarketplace.approval(1, seller.address)).to.be.equal(true)
        })
    })

    describe('Sale', () => {
        beforeEach(async () => {
            let transaction = await landMarketplace.connect(buyer).depositEarnest(1, { value: tokens(5) })
            await transaction.wait()

            transaction = await landMarketplace.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()

            transaction = await landMarketplace.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await landMarketplace.connect(seller).approveSale(1)
            await transaction.wait()

            await buyer.sendTransaction({ to: landMarketplace.address, value: tokens(5) })

            transaction = await landMarketplace.connect(seller).finalizeSale(1)
            await transaction.wait()
        })

        it('Updates ownership', async () => {
            expect(await land.ownerOf(1)).to.be.equal(buyer.address)
        })

        it('Updates balance', async () => {
            expect(await landMarketplace.getBalance()).to.be.equal(0)
        })
    })
})
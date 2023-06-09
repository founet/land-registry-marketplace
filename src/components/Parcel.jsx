import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Parcel = ({ parcel, provider, account, landMarketplace, land, togglePop }) => {
    const [hasBought, setHasBought] = useState(false)
    const [hasInspected, setHasInspected] = useState(false)
    const [hasSold, setHasSold] = useState(false)
    const [isListed, setIsListed] = useState(false)

    const [buyer, setBuyer] = useState(null)
    const [inspector, setInspector] = useState(null)
    const [seller, setSeller] = useState(null)

    const [owner, setOwner] = useState(null)
    const [price, setPrice] = useState("")
    const [purchasePrice, setPurchasePrice] = useState(0)

    const fetchDetails = async () => {

        const isListed = await landMarketplace.isListed(parcel.id)
        setIsListed(isListed)
        // -- Buyer

        const buyer = await landMarketplace.buyer(parcel.id)
        setBuyer(buyer)

        const hasBought = await landMarketplace.approval(parcel.id, buyer)
        setHasBought(hasBought)

        // -- Seller

        const seller = await landMarketplace.seller(parcel.id)
        setSeller(seller)

        const hasSold = await landMarketplace.approval(parcel.id, seller)
        setHasSold(hasSold)

        // -- Inspector

        const inspector = await landMarketplace.inspector()
        setInspector(inspector)

        const hasInspected = await landMarketplace.inspectionPassed(parcel.id)
        setHasInspected(hasInspected)

        const purchasePrice = await landMarketplace.purchasePrice(parcel.id)
        setPurchasePrice(purchasePrice.toNumber())

        console.log(account, seller)
    }

    const fetchOwner = async () => {
        const owner = await landMarketplace.buyer(parcel.id)
        if ('0x0000000000000000000000000000000000000000' !== owner) {
            setOwner(owner)
        }
    }

    const buyHandler = async () => {
        
        const signer = await provider.getSigner()

        // Buyer deposit earnest
        let transaction = await landMarketplace.connect(signer).depositEarnest(parcel.id, { value: purchasePrice })
        await transaction.wait()

        // Buyer approves...
        transaction = await landMarketplace.connect(signer).approveSale(parcel.id)
        await transaction.wait()

        setHasBought(true)
    }

    const inspectHandler = async () => {
        const signer = await provider.getSigner()

        // Inspector updates status
        const transaction = await landMarketplace.connect(signer).updateInspectionStatus(parcel.id, true)
        await transaction.wait()

        setHasInspected(true)
    }

    const sellHandler = async () => {
        const signer = await provider.getSigner()

        // Seller approves...
        let transaction = await landMarketplace.connect(signer).approveSale(parcel.id)
        await transaction.wait()

        // Seller finalize...
        transaction = await landMarketplace.connect(signer).finalizeSale(parcel.id)
        await transaction.wait()

        setHasSold(true)
    }

    const listHandler = async () => {
        const signer = await provider.getSigner()

        let transaction1 = await land.connect(signer).approve(landMarketplace.address, parcel.id)
        await transaction1.wait()

        let transaction = await landMarketplace.connect(signer).list(parcel.id, ethers.utils.parseEther(price.toString()))
        await transaction.wait()
    }

    useEffect(() => {
        fetchDetails()
        fetchOwner()
    }, [hasSold])

    return (
        <div className="parcel">
            <div className='parcel__details'>
                <div className="parcel__image">
                    <img src="parcel.png" alt="Parcel" />
                </div>
                <div className="parcel__overview">
                    <h1 className='text-4xl'>{parcel.name}</h1>
                    <p>
                        <strong>{parcel.attributes[4].value} </strong> | <strong>{parcel.attributes[3].value}</strong>
                    </p>
                    
                    { isListed ? (<h2> {ethers.utils.formatEther(purchasePrice)} ETH</h2>) : ''}

                    {owner && hasSold ? (
                        
                        <div className='parcel__owned'>
                            Owned by {owner.slice(0, 6) + '...' + owner.slice(38, 42)}
                        </div>
                    ) : (
                        <div>
                            { 
                            (account === inspector && hasBought) ? (
                                <button className='parcel__buy' onClick={inspectHandler} disabled={hasInspected}>
                                    Approve Inspection
                                </button>
                            ) : 
                            (account === seller && hasInspected && hasBought && isListed) ? (
                                <button className='parcel__buy' onClick={sellHandler} disabled={hasSold} type='button'>
                                    Approve & Sell
                                </button>
                            ) :''}
                            
                            {(account === seller && !isListed) ? (
                                <>
                                    <input type='text' name='price' className='border-2 p-2 mt-3' placeholder='Price' onChange={e => setPrice(e.target.value)} value={price}/>
                                    <button className='parcel__buy' onClick={listHandler}>
                                        List
                                    </button>
                                </>
                            ): ''}
                            {(account !== seller && account !== inspector && isListed) ? (
                                <button className='parcel__buy' onClick={buyHandler} disabled={hasBought}>
                                    Buy
                                </button>
                            ) : (!isListed) ? 'Not For sale yet ': ''}
                        </div>
                    )}

                    <hr />

                    <h2>Description</h2>
                    <p>
                        {parcel.description}
                    </p>

                    <hr />

                    <h2>Details</h2>

                    <ul>
                        {parcel.attributes.map((attribute, index) => (
                            <li key={index}><strong>{attribute.trait_type}</strong> : {attribute.value}</li>
                        ))}
                    </ul>
                </div>
                <button onClick={togglePop} className="parcel__close">
                    <img src={close} alt="Close" />
                </button>
            </div>

        </div >
    );
}

export default Parcel;
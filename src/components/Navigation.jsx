import { ethers } from 'ethers';
import { useState } from 'react';
import axios from 'axios';

import close from '../assets/close.svg';

const Navigation = ({ account, setAccount, totalSupply, provider, land, landMarketplace }) => {
    const [toggle, setToggle] = useState(false);
    const [file, setFile] = useState(null);
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [country, setCountry] = useState("");
    const [surface, setSurface] = useState("");
    const [town, setTown] = useState("");
    const connectHandler = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = ethers.utils.getAddress(accounts[0])
        setAccount(account);
    }

    const uploadMetadata = async (FileHash) => {
        try {
            const resJSON = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinJsonToIPFS",
                data: {
                    "name": " Parcel in "+town+ ", "+country,
                    "description": "Ce NFT est un titre de propriété numérique représentant une parcelle",
                    "image": "https://gateway.pinata.cloud/ipfs/QmPXuSF46LEfBjaofVSnFMagZyJ4m5gZmAdjUoFsPHTvUt",
                    "external_link": FileHash,
                    "id": totalSupply +1,
                    "attributes": [
                        {
                            "trait_type": "Latitude",
                            "value": latitude
                        },
                        {
                            "trait_type": "Longitude",
                            "value": longitude
                        },
                        {
                            "trait_type": "Surface",
                            "value": surface
                        },
                        {
                            "trait_type": "Country",
                            "value": country
                        },
                        {
                            "trait_type": "Town",
                            "value": town
                        }
                    ]
                },
                headers: {
                    'pinata_api_key': `${process.env.REACT_APP_PINATA_API_KEY}`,
                    'pinata_secret_api_key': `${process.env.REACT_APP_PINATA_API_SECRET}`,
                },
            });
    
            const tokenURI = `https://gateway.pinata.cloud/ipfs/${resJSON.data.IpfsHash}`;
            mintNFT(tokenURI)
    
        } catch (error) {
            console.log("JSON to IPFS: ")
            console.log(error);
        }
    
    
    }
    
    const addParcel = async (e) => {
        e.preventDefault()
        togglePop()
        if (file) {
            try {
                const formData = new FormData();
                formData.append("file", file);
    
                const resFile = await axios({
                    method: "post",
                    url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                    data: formData,
                    headers: {
                        'pinata_api_key': `${process.env.REACT_APP_PINATA_API_KEY}`,
                        'pinata_secret_api_key': `${process.env.REACT_APP_PINATA_API_SECRET}`,
                        "Content-Type": "multipart/form-data"
                    },
                });
    
                const FileHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
                uploadMetadata(FileHash)
    
    
            } catch (error) {
                console.log("File to IPFS: ")
                console.log(error)
            }
        }
    }
    

    const mintNFT = async (tokenURI) => {
      try {
          const signer = provider.getSigner()
          await land.connect(signer).mint(tokenURI)
          await landMarketplace.connect(signer).addSeller(totalSupply+1)
      } catch (error) {
          console.log("Error while minting NFT with contract")
          console.log(error);
      }
    
    }

    const togglePop = () => {
        toggle ? setToggle(false) : setToggle(true);
      }

    return (
        <>
        <nav>
            <ul className='nav__links'>
            <button onClick={togglePop}
                    type="button"
                    className='nav__connect'
                    >Add Parcel</button>
            </ul>

            <div className='nav__brand'>
                <img src='logo.png' alt="Logo" />
                <h2>Land Marketplace</h2>
            </div>

            {account ? (
                <button
                    type="button"
                    className='nav__connect'
                >
                    {account.slice(0, 6) + '...' + account.slice(38, 42)}
                </button>
            ) : (
                <button
                    type="button"
                    className='nav__connect'
                    onClick={connectHandler}
                >
                    Connect
                </button>
            )}
        </nav>
        {toggle && (<div className='parcel'>
            <div className="parcel__details">
            <div className="parcel__overview">
        
            <form onSubmit={addParcel}>
            <h2 className='text-2xl'>Add Your Parcel</h2>
            <br/>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latitude">
                    Latitude
                </label>
                <input type="text" name='latitude' onChange={(e) => setLatitude(e.target.value)} placeholder='Latitude' required value={latitude} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="longitude">
                    Longitude
                </label>
                <input type="text" name='longitude' onChange={(e) => setLongitude(e.target.value)} placeholder='Longitude' required value={longitude} id='longitude' className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
                    Pays
                </label>
                <input type="text" name='country' onChange={(e) => setCountry(e.target.value)} placeholder='Country' required value={country} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="town">
                    Ville
                </label>
                <input type="text" name='town' onChange={(e) => setTown(e.target.value)} placeholder='Town' required value={town} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="surface">
                    Surface
                </label>
                <input type="text" name='surface' onChange={(e) => setSurface(e.target.value)} placeholder='Surface' required value={surface} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
                    Ownership file
                </label>
                <input type="file" name='file' onChange={(e) => setFile(e.target.files[0])} placeholder='Ownership file' required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
            </div>
            <button className='bttn_ui me-3 nav__connect' type='submit' >Add Parcel</button>
        
            </form>
            <button onClick={togglePop} className="parcel__close">
                    <img src={close} alt="Close dialog" />
                </button>
                </div>
            </div>
        </div>)}
        </>
    );
}

export default Navigation;
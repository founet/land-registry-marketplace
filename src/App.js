import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Parcel from './components/Parcel';

// ABIs
import Land from './abis/Land.json'
import LandMarketPlace from './abis/LandMarketplace.json'

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [landMarketPlace, setLandMarketPlace] = useState(null)
  const [land, setLand] = useState(null)

  const [account, setAccount] = useState(null)

  const [parcels, setParcels] = useState([])
  const [parcel, setParcel] = useState({})
  const [toggle, setToggle] = useState(false);

  const [fileImg, setFileImg] = useState(null);
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [totalSupply, setTotalSupply] = useState(0)

  const sendJSONtoIPFS = async (ImgHash) => {

      try {

          const resJSON = await axios({
              method: "post",
              url: "https://api.pinata.cloud/pinning/pinJsonToIPFS",
              data: {
                  "name": "Luxury NYC Penthouse",
                  "address": "157 W 57th St APT 49B, New York, NY 10019",
                  "description": "Luxury Penthouse located in the heart of NYC",
                  "image": ImgHash,
                  "id": totalSupply +1,
                  "attributes": [
                      {
                          "trait_type": "Purchase Price",
                          "value": 20
                      },
                      {
                          "trait_type": "Type of Residence",
                          "value": "Condo"
                      },
                      {
                          "trait_type": "Bed Rooms",
                          "value": 2
                      },
                      {
                          "trait_type": "Bathrooms",
                          "value": 3
                      },
                      {
                          "trait_type": "Square Feet",
                          "value": 2200
                      },
                      {
                          "trait_type": "Year Built",
                          "value": 2013
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

  const sendFileToIPFS = async (e) => {
      e.preventDefault()
      if (fileImg) {
          try {
              const formData = new FormData();
              formData.append("file", fileImg);

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

              const ImgHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
              // console.log(response.data.IpfsHash);
              sendJSONtoIPFS(ImgHash)


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
          await landMarketPlace.connect(signer).addSeller(totalSupply+1)
          setTotalSupply(totalSupply+1)
      } catch (error) {
          console.log("Error while minting NFT with contract")
          console.log(error);
      }

  }

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
    const network = await provider.getNetwork()
    const land = new ethers.Contract(config[network.chainId].land.address, Land, provider)
    setLand(land)
    const totalSupply = await land.totalSupply()
    setTotalSupply(totalSupply.toNumber())
    const parcels = []
    
    for (var i = 1; i <= totalSupply; i++) {
      const uri = await land.tokenURI(i)
      const response = await fetch(uri)
      const metadata = await response.json()
      parcels.push(metadata)
    }

    setParcels(parcels)

    const landMarketPlace = new ethers.Contract(config[network.chainId].landmarketpace.address, LandMarketPlace, provider)
    setLandMarketPlace(landMarketPlace)

    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0])
      setAccount(account);
    })
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  const togglePop = (parcel) => {
    setParcel(parcel)
    toggle ? setToggle(false) : setToggle(true);
  }

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className='cards__section'>

        <h3>Parcels For You</h3>

        <hr />

        <div className='cards'>
        <div className='mt-3 text-center'>
            <h2 className='text-white mb-3'>Ajouter une parcelle</h2>
            <form onSubmit={sendFileToIPFS}>
                <input type="file" onChange={(e) => setFileImg(e.target.files[0])} required />
                <input type="text" onChange={(e) => setName(e.target.value)} placeholder='name' required value={name} />
                <input type="text" onChange={(e) => setDesc(e.target.value)} placeholder="desc" required value={desc} />
                <br />
                <button className='bttn_ui me-3' type='submit' >Ajouter une parcelle</button>
        
            </form>
        
        </div>
          {parcels.map((parcel, index) => (
            <div className='card' key={index} onClick={() => togglePop(parcel)}>
              <div className='card__image'>
                <img src={parcel.image} alt="Parcel" />
              </div>
              <div className='card__info'>
                <h4>{parcel.attributes[0].value} ETH</h4>
                <p>
                  <strong>{parcel.attributes[2].value}</strong> bds |
                  <strong>{parcel.attributes[3].value}</strong> ba |
                  <strong>{parcel.attributes[4].value}</strong> sqft
                </p>
                <p>{parcel.address}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {toggle && (
        <Parcel parcel={parcel} provider={provider} account={account} landMarketplace={landMarketPlace}  land={land} togglePop={togglePop} />
      )}

    </div>
  );
}

export default App;

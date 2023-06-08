import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

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
  const [totalSupply, setTotalSupply] = useState(0)

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
    const network = await provider.getNetwork()
    const land = new ethers.Contract(config[network.chainId].land.address, Land, provider)
    setLand(land)
    const totalSupply = await land.totalSupply()
    setTotalSupply(totalSupply.toNumber())
    const parcels = []
    
    for (var i = 1; i <= totalSupply.toNumber(); i++) {
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
      <Navigation account={account} setAccount={setAccount} land={land} landMarketplace={landMarketPlace} provider={provider} totalSupply={totalSupply}/>
      <Search />

      <div className='cards__section'>

        <h3>Parcels For You</h3>

        <hr />

        <div className='cards'>
          {parcels.map((parcel, index) => (
            <div className='card' key={index} onClick={() => togglePop(parcel)}>
              <div className='card__image'>
                <img src="parcel.png" alt="Parcel" />
              </div>
              <div className='card__info'>
              <p>
                  <strong>Latitude : {parcel.attributes[0].value}</strong> | Longitude <strong>{parcel.attributes[1].value}</strong>
                </p>
                <p>
                  <strong>{parcel.attributes[2].value}</strong> sq
                </p>
                <p>
                  <strong>{parcel.attributes[4].value}</strong> | <strong>{parcel.attributes[3].value}</strong>
                </p>
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

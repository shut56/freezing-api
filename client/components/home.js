import React from 'react'
import Head from './head'

const Home = () => {
  return (
    <div>
      <Head title="Home" />
      <div className="flex flex-col h-screen justify-start items-center bg-primary">
        <div className="my-2">
          <img src="images/FreezingLogo.png" alt="Freezing Logo" />
        </div>
        <div className="my-2 text-primary"> The RESTful Freezing API </div>
        <div className="my-2">
          <span className="text-primary">https://freezing-api.io/api/v1/</span>
          <input className="mx-2 text-blue-900 rounded" type="text" />
          <button className="text-primary" type="button">
            Send
          </button>
        </div>
        <div id="result" />
      </div>
    </div>
  )
}

Home.propTypes = {}

export default Home

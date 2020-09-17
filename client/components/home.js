import React, { useState, useEffect } from 'react'
import axios from 'axios'

import Head from './head'
import Viewer from './viewer'

const Home = () => {
  const [data, setData] = useState()

  const getData = () => {
    axios('/api/v1/').then((obj) => setData(obj.data))
  }

  const onClick = () => {
    getData()
  }

  useEffect(() => {
    getData()
    return () => {}
  }, [])

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
          <button className="text-primary" type="button" onClick={onClick}>
            Send
          </button>
        </div>
        <Viewer data={data} />
      </div>
    </div>
  )
}

Home.propTypes = {}

export default Home

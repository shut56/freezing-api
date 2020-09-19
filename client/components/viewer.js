import React from 'react'
import ReactJson from 'react-json-view'

const Viewer = (props) => {
  console.log(props.data)
  return (
    <div className="w-screen p-4">
      <div className="bg-gray-200 p-2 rounded">
        <ReactJson
          src={props.data}
          name={false}
          indentWidth={2}
          displayDataTypes={false}
          enableClipboard
          sortKeys
        />
      </div>
    </div>
  )
}

Viewer.propTypes = {}

export default React.memo(Viewer)

import { isNil } from 'ramda'
import React from 'react'

import './Puyo.css'

const positionStyle = (x, y) => ({
  left: x * 70,
  top: y * 70,
  transformOrigin: '35px -35px 0px'
})

export default ({puyo: {x, y, color, rot, deltaX, deltaY}}) => {
  const style = isNil(rot)
    ? positionStyle(x, y)
    : {...positionStyle(x - deltaX, y - deltaY + 1), transform: `rotate(${rot * 90}deg)`}

  return (
    <div style={style} className={`Puyo Puyo-${color}`}/>
  )
}

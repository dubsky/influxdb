// Libraries
import React from 'react'
import {FunctionComponent} from 'react'
import {Config} from '@influxdata/giraffe/dist'
import AntPath from 'react-leaflet-ant-path'

// Utils

// Types
import {GeoTable} from 'src/shared/components/geo/processing/GeoTable'
import {GeoTrackMapViewLayer} from 'src/client'

interface Props {
  table: GeoTable
  properties: GeoTrackMapViewLayer
  stylingConfig: Partial<Config>
}

export const TrackMapLayer: FunctionComponent<Props> = props => {
  const {table, properties} = props
  const colors = properties.colors || [{hex: '#FFC400'}, {hex: '#F90A13'}]

  const startColor = colors[0].hex
  const endColor = colors[colors.length - 1].hex
  const options = {
    weight: properties.trackWidth || 3,
    color: startColor,
    pulseColor: startColor === endColor ? 'white' : endColor,
    delay: 50 + (properties.speed || 500),
    hardwareAccelerated: true,
  }
  return (
    <>
      {table.mapTracks((track, options, index) => {
        return <AntPath key={index} positions={track} options={options} />
      }, options)}
    </>
  )
}

export default TrackMapLayer

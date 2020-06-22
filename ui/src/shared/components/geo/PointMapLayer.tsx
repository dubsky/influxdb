// Libraries
import React from 'react'
import {createRef, FunctionComponent, useLayoutEffect} from 'react'
import {Marker} from 'react-leaflet'
import {Config} from '@influxdata/giraffe/dist'

// Utils
import {getColor} from 'src/shared/components/geo/dimensionCalculations'
import {SVGIcon} from 'src/shared/components/geo/SVGIcon'
import {
  defineToolTipEffect,
  formatValue,
} from 'src/shared/components/geo/processing/toolTips'

// Types
import {GeoTable} from 'src/shared/components/geo/processing/GeoTable'
import {GeoPointMapViewLayer} from 'src/client'
import {GeoTooltip} from './GeoTooltip'

const ICON_SIZE = [26, 38]

interface Props {
  table: GeoTable
  colorFieldName: string
  properties: GeoPointMapViewLayer
  stylingConfig: Partial<Config>
}

const formatRowInfo = (
  properties: GeoPointMapViewLayer,
  table: GeoTable,
  index
) => {
  const colorValue = table.getValue(index, properties.colorField)
  const {colorDimension} = properties
  const colorInfo = formatValue(
    properties.colorField,
    'Color',
    colorValue,
    colorDimension
  )
  if (colorInfo) return [colorInfo]
  return []
}

export const PointMapLayer: FunctionComponent<Props> = props => {
  const {table, colorFieldName, properties, stylingConfig} = props
  const rowCount = table.getRowCount()
  const result = [],
    tooltips = []
  for (let i = 0; i < rowCount; i++) {
    const latLon = table.getLatLon(i)
    if (!latLon) continue
    const {lat, lon} = latLon
    const colorValue = table.getValue(i, colorFieldName)
    const color = getColor(properties.colors, colorValue, false)
    const icon = SVGIcon({color: color, iconSize: ICON_SIZE})
    const markerRef = createRef<Marker>()
    result.push(
      <Marker ref={markerRef} key={i} position={[lat, lon]} icon={icon} />
    )
    const rowInfo = formatRowInfo(properties, table, i)
    tooltips.push({markerRef, rowInfo})
  }

  const tooltip = (
    <GeoTooltip
      stylingConfig={stylingConfig}
      onCreate={setTooltip => {
        useLayoutEffect(defineToolTipEffect(tooltips, setTooltip), [
          properties,
          table,
        ])
      }}
    />
  )
  return (
    <>
      {result}
      {tooltip}
    </>
  )
}

export default PointMapLayer

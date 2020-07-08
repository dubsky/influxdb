// Libraries
import React, {createRef, PureComponent} from 'react'
import {Config} from '@influxdata/giraffe/dist'
import {Table} from '@influxdata/giraffe'
import {Map, TileLayer} from 'react-leaflet'
import Control from 'react-leaflet-control'
import 'leaflet/dist/leaflet.css'

// Components
import CircleMarkerLayer from 'src/shared/components/geo/CircleMarkerLayer'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'
import {preprocessData} from 'src/shared/components/geo/processing/tableProcessing'

// Types
import {
  GeoCircleViewLayer,
  GeoHeatMapViewLayer,
  GeoPointMapViewLayer,
  GeoViewLayer,
} from 'src/client'
import HeatmapLayer from 'src/shared/components/geo/HeatmapLayer'
import PointMapLayer from 'src/shared/components/geo/PointMapLayer'
import {GeoTable} from 'src/shared/components/geo/processing/GeoTable'

// Constants
const ZOOM_FRACTION = 8

interface Props {
  width: number
  height: number
  table: Table
  lat: number
  lon: number
  zoom: number
  isViewportEditable: boolean
  detectCoordinateFields: boolean
  onViewportChange: (lat: number, lon: number, zoom: number) => void
  layers: GeoViewLayer[]
  stylingConfig: Partial<Config>
  tileServerUrl: string
}

interface State {}

@ErrorHandling
class Geo extends PureComponent<Props, State> {
  private mapRef = createRef<Map>()
  private preprocessedTable: GeoTable

  constructor(props: Props) {
    super(props)
    const {table, detectCoordinateFields} = this.props
    this.preprocessedTable = table
      ? preprocessData(
          table,
          Geo.getRowLimit(props.layers),
          detectCoordinateFields,
          preprocessedTable => {
            this.preprocessedTable = preprocessedTable
            this.forceUpdate()
          }
        )
      : null
  }

  private static getRowLimit(layers: GeoViewLayer[]) {
    return Math.min.apply(
      null,
      layers.map(l => {
        switch (l.type) {
          case 'circleMap':
            return 5000
          case 'heatmap':
            return 100000
          case 'pointMap':
            return 2000
        }
      })
    )
  }

  public componentDidUpdate(prevProps: Props) {
    const {width, height} = this.props
    if (prevProps.width !== width || prevProps.height !== height)
      this.mapRef.current.leafletElement._onResize()
  }

  public componentWillReceiveProps(nextProps: Props) {
    const {width, height} = nextProps
    if (width === 0 || height === 0) return
    const {table, detectCoordinateFields} = this.props
    if (
      nextProps.table !== table ||
      nextProps.detectCoordinateFields !== detectCoordinateFields
    ) {
      this.preprocessedTable = preprocessData(
        nextProps.table,
        Geo.getRowLimit(nextProps.layers),
        nextProps.detectCoordinateFields,
        preprocessedTable => {
          this.preprocessedTable = preprocessedTable
          this.forceUpdate()
        }
      )
    }
  }

  private onViewportChange = (viewport: {center?: number[]; zoom?: number}) => {
    this.props.onViewportChange(
      viewport.center[0],
      viewport.center[1],
      viewport.zoom
    )
  }

  private getMinZoom(width: number): number {
    // Math.max(Math.log2(width/256)),Math.log2(height/256))
    // while the formula above would be technically correct, problem is that
    // web map projection is square (as opposed to regular book based world maps).
    // The polar areas are extremely distorted and people don't
    // want to look at those - they usually want to see all the continents and
    // expect to see a rectangle, similar to book based maps.
    return Math.ceil(Math.log2(width / 256) * ZOOM_FRACTION) / ZOOM_FRACTION
  }

  public render() {
    const {width, height} = this.props
    if (width === 0 || height === 0) return null
    const {lat, lon, zoom, stylingConfig} = this.props
    const {layers, tileServerUrl} = this.props
    const {preprocessedTable} = this
    return (
      <Map
        ref={this.mapRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
        center={{lat, lon}}
        zoom={zoom}
        minZoom={this.getMinZoom(width)}
        zoomDelta={1}
        zoomSnap={1 / ZOOM_FRACTION}
        onViewportChanged={this.onViewportChange}
        dragging={this.props.isViewportEditable}
        zoomControl={this.props.isViewportEditable}
        scrollWheelZoom={this.props.isViewportEditable}
        attributionControl={false}
      >
        <TileLayer url={tileServerUrl} minNativeZoom={3}/>
        {layers.map((layer, index) => {
          if (!preprocessedTable) return
          switch (layer.type) {
            case 'circleMap':
              const circleLayer = layer as GeoCircleViewLayer
              return (
                <CircleMarkerLayer
                  key={index}
                  radiusFieldName={circleLayer.radiusField}
                  colorFieldName={circleLayer.colorField}
                  table={preprocessedTable}
                  properties={circleLayer}
                  stylingConfig={stylingConfig}
                />
              )
            case 'heatmap':
              const heatmapLayer = layer as GeoHeatMapViewLayer
              return (
                <HeatmapLayer
                  key={index}
                  intensityFieldName={heatmapLayer.intensityField}
                  table={preprocessedTable}
                  blur={heatmapLayer.blur}
                  radius={heatmapLayer.radius}
                  properties={heatmapLayer}
                />
              )
            case 'pointMap':
              const pointMapLayer = layer as GeoPointMapViewLayer
              return (
                <PointMapLayer
                  key={index}
                  colorFieldName={pointMapLayer.colorField}
                  table={preprocessedTable}
                  properties={pointMapLayer}
                  stylingConfig={stylingConfig}
                />
              )
          }
        })}
        {preprocessedTable && preprocessedTable.isTruncated() && (
          <Control position="bottomleft">
            <div className="truncatedResults">
              Results are truncated.{' '}
              <a
                href="https://docs.influxdata.com/chronograf/latest/guides/geo-widget#data-downsampling"
                target="_blank"
              >
                More...
              </a>
            </div>
          </Control>
        )}
      </Map>
    )
  }
}

export default Geo

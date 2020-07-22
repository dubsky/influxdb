// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {invert} from 'lodash'
import {
  AlignItems,
  Button,
  ButtonShape,
  ComponentColor,
  ComponentSize,
  FlexBox,
  FlexDirection,
  Form,
  Grid,
  IconFont,
  Input,
  InputType,
  SelectDropdown,
} from '@influxdata/clockface'

// Types
import {GeoViewProperties} from 'src/types/dashboards'
import {AppState} from 'src/types'
import {
  GeoCircleViewLayer,
  GeoHeatMapViewLayer,
  GeoPointMapViewLayer,
  GeoViewLayer,
  GeoViewLayerProperties,
  GeoTrackMapViewLayer,
} from 'src/client'

// Components
import {ButtonCollapsible} from 'src/timeMachine/components/view_options/geo/ButtonCollapsible'
import Checkbox from 'src/shared/components/Checkbox'
import GeoCircleLayerOptions from 'src/timeMachine/components/view_options/geo/GeoCircleLayerOptions'
import GeoHeatmapLayerOptions from 'src/timeMachine/components/view_options/geo/GeoHeatmapLayerOptions'
import GeoPointMapLayerOptions from 'src/timeMachine/components/view_options/geo/GeoPointMapLayerOptions'
import GeoTrackMapLayerOptions from 'src/timeMachine/components/view_options/geo/GeoTrackMapLayerOptions'

// Actions
import {
  setDetectCoordinateFields,
  setAllowPanAndZoom,
  setLatitude,
  setLongitude,
  setZoom,
  setField,
  addGeoLayer,
  removeGeoLayer,
} from 'src/timeMachine/components/view_options/geo/geoActions'

// Utils
import {getVisTable} from 'src/timeMachine/selectors'
import {getColumnNames} from 'src/shared/components/geo/processing/tableProcessing'
import {nameOf} from 'src/shared/components/geo/dimensionCalculations'
import {defaultGeoLayer} from 'src/views/helpers'

const MIN_ZOOM_FACTOR = 0
const MAX_ZOOM_FACTOR = 28
const MIN_LONGITUDE = -180
const MAX_LONGITUDE = 180
const MIN_LATITUDE = -90
const MAX_LATITUDE = 90

interface StateProps {
  columns: string[]
}

interface OwnProps extends GeoViewProperties {}

interface DispatchProps {
  onUpdateLat: (lat: number) => void
  onUpdateLon: (lon: number) => void
  onUpdateZoom: (zoom: number) => void
  onUpdateAllowPanAndZoom: (allowPanAndZoom: boolean) => void
  onUpdateDetectCoordinateFields: (detectCoordinateFields: boolean) => void
  onUpdateLayerType: (type: string, layer: number) => void
  onAddLayer: (layer: GeoViewLayer) => void
  onRemoveLayer: (layerId: number) => void
}

type Props = OwnProps & StateProps & DispatchProps

const VISUALIZATION_TYPES = {
  'Circle map': 'circleMap',
  'Point map': 'pointMap',
  Heatmap: 'heatmap',
  'Track map': 'trackMap',
}

class GeoOptions extends PureComponent<Props> {
  public renderLayer(id: number, layer: GeoViewLayer) {
    const type = invert(VISUALIZATION_TYPES)[layer.type]
    const {columns} = this.props
    return (
      <>
        <Form.Element label="Visualization type">
          <SelectDropdown
            options={Object.keys(VISUALIZATION_TYPES)}
            selectedOption={type || 'Circle map'}
            onSelect={value => {
              this.props.onUpdateLayerType(value, id)
            }}
          />
        </Form.Element>
        {layer.type === 'circleMap' && (
          <GeoCircleLayerOptions
            id={id}
            key={id}
            columns={columns}
            layer={layer as GeoCircleViewLayer}
          />
        )}
        {layer.type === 'heatmap' && (
          <GeoHeatmapLayerOptions
            id={id}
            key={id}
            columns={columns}
            layer={layer as GeoHeatMapViewLayer}
          />
        )}
        {layer.type === 'pointMap' && (
          <GeoPointMapLayerOptions
            id={id}
            key={id}
            columns={columns}
            layer={layer as GeoPointMapViewLayer}
          />
        )}
        {layer.type === 'trackMap' && (
          <GeoTrackMapLayerOptions
            id={id}
            key={id}
            columns={columns}
            layer={layer as GeoTrackMapViewLayer}
          />
        )}
      </>
    )
  }

  public render() {
    const {props} = this
    const {
      layers,
      allowPanAndZoom,
      onUpdateAllowPanAndZoom,
      onAddLayer,
      onRemoveLayer,
      detectCoordinateFields,
      onUpdateDetectCoordinateFields,
    } = props
    return (
      <>
        <Grid.Column className={'geo-options'}>
          <h4 className="view-options--header">Customize Geo Chart</h4>
          <Grid.Column className={'data grouping checkbox'}>
            <Checkbox
              label={
                <span>
                  Search results for coordinates and fields.{' '}
                  <a
                    href={
                      'https://docs.influxdata.com/chronograf/latest/guides/geo-widget#automatic-pivoting'
                    }
                    target={'_blank'}
                  >
                    More...
                  </a>
                </span>
              }
              checked={detectCoordinateFields}
              onSetChecked={onUpdateDetectCoordinateFields}
            />
          </Grid.Column>
          <Grid.Column className={'movement checkbox'}>
            <Checkbox
              label="Allow pan and zoom"
              checked={allowPanAndZoom}
              onSetChecked={onUpdateAllowPanAndZoom}
            />
          </Grid.Column>
          <ButtonCollapsible
            className={'locationButton'}
            passiveText={'SET LOCATION'}
            activeText={'HIDE'}
            sectionTitle={'Location'}
            contents={
              <>
                <FlexBox
                  direction={FlexDirection.Row}
                  alignItems={AlignItems.Center}
                  margin={ComponentSize.Small}
                  testID={'geo-location'}
                >
                  <Form.Element label="Latitude">
                    <Input
                      style={{flex: '1 0 0'}}
                      testID={`geo-lat-input`}
                      value={props.center.lat}
                      placeholder="Latitude"
                      min={MIN_LATITUDE}
                      max={MAX_LATITUDE}
                      type={InputType.Number}
                      onChange={e => {
                        props.onUpdateLat(Number(e.target.value))
                      }}
                    />
                  </Form.Element>
                  <Form.Element label="Longitude">
                    <Input
                      style={{flex: '1 0 0'}}
                      testID={`geo-lon-input`}
                      value={props.center.lon}
                      placeholder="Longitude"
                      min={MIN_LONGITUDE}
                      max={MAX_LONGITUDE}
                      type={InputType.Number}
                      onChange={e => props.onUpdateLon(Number(e.target.value))}
                    />
                  </Form.Element>
                  <Form.Element label="Zoom level">
                    <Input
                      style={{flex: '1 0 0'}}
                      testID={`geo-zoom-input`}
                      value={props.zoom}
                      placeholder="Zoom Factor 0-28"
                      min={MIN_ZOOM_FACTOR}
                      max={MAX_ZOOM_FACTOR}
                      type={InputType.Number}
                      onChange={e => props.onUpdateZoom(Number(e.target.value))}
                    />
                  </Form.Element>
                </FlexBox>
              </>
            }
          />
          {layers.map((layer, id) => {
            return (
              <div key={id}>
                <h4>
                  {id === 0 && 'Top Layer'}
                  {layers.length > 1 &&
                    id === layers.length - 1 &&
                    'Bottom Layer'}
                  {layers.length > 1 && (
                    <Button
                      className={'removeLayerButton'}
                      shape={ButtonShape.Default}
                      text={'Remove'}
                      onClick={() => {
                        onRemoveLayer(id)
                      }}
                    />
                  )}
                </h4>
                {this.renderLayer(id, layer)}
              </div>
            )
          })}

          {layers.length < 2 && (
            <Grid.Column className={'settings'}>
              <Button
                icon={IconFont.Plus}
                shape={ButtonShape.Default}
                text="Add another layer"
                color={ComponentColor.Primary}
                onClick={() => {
                  onAddLayer(defaultGeoLayer())
                }}
              />
            </Grid.Column>
          )}
        </Grid.Column>
      </>
    )
  }
}

const mapDispatchToProps: DispatchProps = {
  onUpdateLat: setLatitude,
  onUpdateLon: setLongitude,
  onUpdateZoom: setZoom,
  onUpdateAllowPanAndZoom: setAllowPanAndZoom,
  onUpdateDetectCoordinateFields: setDetectCoordinateFields,
  onAddLayer: addGeoLayer,
  onRemoveLayer: removeGeoLayer,
  onUpdateLayerType(type: string, layer: number) {
    console.log(
      VISUALIZATION_TYPES[type],
      type,
      nameOf<GeoViewLayer>('type'),
      layer
    )
    return setField(
      nameOf<GeoViewLayerProperties>('type'),
      VISUALIZATION_TYPES[type],
      layer
    )
  },
}

const mapStateToProps = (state: AppState, ownProps: OwnProps) => {
  const {table} = getVisTable(state)
  return {columns: getColumnNames(table, ownProps.detectCoordinateFields)}
}

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps
)(GeoOptions)

// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {Form, Grid, Input, InputType} from '@influxdata/clockface'

// Components
import ThresholdsSettings from 'src/shared/components/ThresholdsSettings'
import DimensionValueDisplayProperties from 'src/shared/components/geo/DimensionValueDisplayProperties'
import FieldSelector from 'src/timeMachine/components/view_options/geo/GeoFieldSelector'
import Checkbox from 'src/shared/components/Checkbox'
import AutoDomainInput from 'src/shared/components/AutoDomainInput'

// Actions
import {
  setDimensionProperty,
  setField,
  setLayerColors,
  setRadius,
} from 'src/timeMachine/components/view_options/geo/geoActions'

// Types
import {Color} from 'src/types/colors'
import {Axis, GeoCircleViewLayer} from 'src/client'

// Utils
import {parseYBounds as parseBounds} from 'src/shared/utils/vis'
import {nameOf} from 'src/shared/components/geo/dimensionCalculations'

const MIN_CIRCLE_RADIUS = 1
const MAX_CIRCLE_RADIUS = 100

interface OwnProps {
  id: number
  layer: GeoCircleViewLayer
  columns: string[]
}

interface DispatchProps {
  onUpdateColors: (colors: Color[], layer: number) => void
  onUpdateRadius: (radius: number, layer: number) => void
  onUpdateField: (fieldName: string, field: string, layer: number) => void
  onUpdateDimensionProperty: (
    layerId: number,
    dimensionProperty: string,
    property,
    value
  ) => void
}

type Props = OwnProps & DispatchProps

class GeoCircleLayerOptions extends PureComponent<Props> {
  public render() {
    const {props} = this
    const {columns, layer, id} = props
    return (
      <>
        <h5 className="view-options--header">Circle size</h5>
        <Form.Element label="Circle radius column">
          <FieldSelector
            selectedColumn={layer.radiusField}
            onSelectColumn={field => {
              props.onUpdateField(
                nameOf<GeoCircleViewLayer>('radiusField'),
                field,
                id
              )
            }}
            availableColumns={columns}
          />
        </Form.Element>
        <Form.Element label="Maximum circle radius (pixels)">
          <Input
            style={{flex: '1 0 0'}}
            testID={`geo-radius-input`}
            value={layer.radius}
            placeholder="Radius in px"
            min={MIN_CIRCLE_RADIUS}
            max={MAX_CIRCLE_RADIUS}
            type={InputType.Number}
            onChange={e => {
              props.onUpdateRadius(Number(e.target.value), id)
            }}
          />
        </Form.Element>
        <AutoDomainInput
          minLabel={'Value for radius=1'}
          maxLabel={`Value for radius=${layer.radius}`}
          domain={parseBounds(layer.radiusDimension.bounds)}
          onSetDomain={bounds => this.handleSetRadiusDomain(bounds, id)}
          label="Value to radius mapping"
        />

        <DimensionValueDisplayProperties
          dimension={layer.radiusDimension}
          onChange={(property, value) => {
            props.onUpdateDimensionProperty(
              id,
              nameOf<GeoCircleViewLayer>('radiusDimension'),
              property,
              value
            )
          }}
        />

        <h5 className="view-options--header color-thresholds-header">
          Circle colors
        </h5>
        <Form.Element label="Color column">
          <FieldSelector
            selectedColumn={layer.colorField}
            onSelectColumn={field => {
              props.onUpdateField(
                nameOf<GeoCircleViewLayer>('colorField'),
                field,
                id
              )
            }}
            availableColumns={columns}
          />
        </Form.Element>
        <label className="cf-form--label">
          <span>Color thresholds</span>
        </label>
        <ThresholdsSettings
          thresholds={layer.colors}
          onSetThresholds={colors => {
            props.onUpdateColors(colors, id)
          }}
        />
        <Grid.Column className={'color-transition checkbox'}>
          <Checkbox
            label="Enable fluid color transitions"
            checked={false}
            onSetChecked={() => {}}
          />
        </Grid.Column>
        <DimensionValueDisplayProperties
          dimension={layer.colorDimension}
          onChange={(property, value) => {
            props.onUpdateDimensionProperty(
              id,
              nameOf<GeoCircleViewLayer>('colorDimension'),
              property,
              value
            )
          }}
        />
      </>
    )
  }

  handleSetRadiusDomain(radiusDomain: [number, number], layer: number): void {
    let bounds: [string, string] | [null, null]
    if (radiusDomain) {
      bounds = [String(radiusDomain[0]), String(radiusDomain[1])]
    } else {
      bounds = [null, null]
    }
    this.props.onUpdateDimensionProperty(
      layer,
      nameOf<GeoCircleViewLayer>('radiusDimension'),
      nameOf<Axis>('bounds'),
      bounds
    )
  }
}

const mapDispatchToProps: DispatchProps = {
  onUpdateColors: setLayerColors,
  onUpdateField: setField,
  onUpdateRadius: setRadius,
  onUpdateDimensionProperty: setDimensionProperty,
}

export default connect<{}, DispatchProps, OwnProps>(
  null,
  mapDispatchToProps
)(GeoCircleLayerOptions)

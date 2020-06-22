// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {Form} from '@influxdata/clockface'

// Components
import FieldSelector from 'src/timeMachine/components/view_options/geo/GeoFieldSelector'
import ThresholdsSettings from 'src/shared/components/ThresholdsSettings'
import DimensionValueDisplayProperties from 'src/shared/components/geo/DimensionValueDisplayProperties'

// Actions
import {
  setDimensionProperty,
  setField,
  setLayerColors,
} from 'src/timeMachine/components/view_options/geo/geoActions'

// Types
import {GeoPointMapViewLayer} from 'src/client'

// Utils
import {nameOf} from 'src/shared/components/geo/dimensionCalculations'
import {Color} from 'src/types'

interface OwnProps {
  id: number
  layer: GeoPointMapViewLayer
  columns: string[]
}

interface DispatchProps {
  onUpdateColors: (colors: Color[], layer: number) => void
  onUpdateField: (
    fieldName: string,
    field: string | number,
    layer: number
  ) => void
  onUpdateDimensionProperty: (
    layerId: number,
    dimensionProperty: string,
    property,
    value
  ) => void
}

type Props = OwnProps & DispatchProps

class GeoPointMapLayerOptions extends PureComponent<Props> {
  public render() {
    const {props} = this
    const {columns, layer, id} = props
    const {colorField, colorDimension, colors} = layer

    return (
      <>
        <h5 className="view-options--header">Marker Color</h5>
        <Form.Element label="Color column">
          <FieldSelector
            selectedColumn={colorField}
            onSelectColumn={field => {
              props.onUpdateField(
                nameOf<GeoPointMapViewLayer>('colorField'),
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
          thresholds={colors}
          onSetThresholds={colors => {
            props.onUpdateColors(colors, id)
          }}
        />
        <h5 className="view-options--header color-thresholds-header">Legend</h5>
        <DimensionValueDisplayProperties
          dimension={colorDimension}
          onChange={(property, value) => {
            props.onUpdateDimensionProperty(
              id,
              nameOf<GeoPointMapViewLayer>('colorDimension'),
              property,
              value
            )
          }}
        />
      </>
    )
  }
}

const mapDispatchToProps: DispatchProps = {
  onUpdateColors: setLayerColors,
  onUpdateField: setField,
  onUpdateDimensionProperty: setDimensionProperty,
}

export default connect<{}, DispatchProps, OwnProps>(
  null,
  mapDispatchToProps
)(GeoPointMapLayerOptions)

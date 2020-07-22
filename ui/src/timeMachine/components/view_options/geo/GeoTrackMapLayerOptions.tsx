// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {Form, Grid, Input, InputType} from '@influxdata/clockface'

// Components
import ColorSchemeDropdown from 'src/shared/components/ColorSchemeDropdown'

// Actions
import {
  setField,
  setLayerColors,
} from 'src/timeMachine/components/view_options/geo/geoActions'

// Types
import {Color} from 'src/types'
import {GeoTrackMapViewLayer} from 'src/client'

// Utils
import {nameOf} from 'src/shared/components/geo/dimensionCalculations'
import Checkbox from 'src/shared/components/Checkbox'

interface OwnProps {
  id: number
  layer: GeoTrackMapViewLayer
  columns: string[]
}

interface DispatchProps {
  onUpdateColors: (colors: Color[], layer: number) => void
  onUpdateField: (
    fieldName: string,
    field: string | number | boolean,
    layer: number
  ) => void
}

type Props = OwnProps & DispatchProps

class GeoTrackMapLayerOptions extends PureComponent<Props> {
  public render() {
    const {props} = this
    const {id, layer} = props
    const {randomColors} = layer

    return (
      <>
        <Form.Element label="Track Width">
          <Input
            style={{flex: '1 0 0'}}
            testID={`geo-track-width`}
            value={layer.trackWidth}
            placeholder="Track width (px)"
            min={1}
            max={25}
            type={InputType.Number}
            onChange={e => {
              props.onUpdateField(
                nameOf<GeoTrackMapViewLayer>('trackWidth'),
                Number(e.target.value),
                id
              )
            }}
          />
        </Form.Element>
        <Form.Element label="Animation Speed">
          <Input
            style={{flex: '1 0 0'}}
            testID={`geo-animation-speed`}
            value={layer.speed}
            placeholder="Track animation speed 0 - 5000"
            min={0}
            max={5000}
            type={InputType.Number}
            onChange={e => {
              props.onUpdateField(
                nameOf<GeoTrackMapViewLayer>('speed'),
                Number(e.target.value),
                id
              )
            }}
          />
        </Form.Element>
        <Grid.Column className={'trackColor checkbox'}>
          <Checkbox
            label="Automatically assign track colors"
            checked={randomColors}
            onSetChecked={value => {
              props.onUpdateField(
                nameOf<GeoTrackMapViewLayer>('randomColors'),
                value,
                id
              )
            }}
          />
        </Grid.Column>
        {!randomColors && (
          <Form.Element label="Track Color">
            <ColorSchemeDropdown
              value={layer.colors}
              onChange={colors => {
                props.onUpdateColors(colors, id)
              }}
            />
          </Form.Element>
        )}
      </>
    )
  }
}

const mapDispatchToProps: DispatchProps = {
  onUpdateField: setField,
  onUpdateColors: setLayerColors,
}

export default connect<{}, DispatchProps, OwnProps>(
  null,
  mapDispatchToProps
)(GeoTrackMapLayerOptions)

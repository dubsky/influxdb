// Libraries
import React, {FunctionComponent} from 'react'
import {
  ButtonShape,
  Form,
  FormElement,
  Input,
  InputType,
  SelectGroup,
} from '@influxdata/clockface'

// Constants
import {AXES_SCALE_OPTIONS} from 'src/dashboards/constants/cellEditor'

// Types
import {Axis} from 'src/client'

interface Props {
  dimension: Axis
  onChange: (property: string, value: string) => void
}

export const DimensionValueDisplayProperties: FunctionComponent<
  Props
> = props => {
  const {BASE_2, BASE_10} = AXES_SCALE_OPTIONS
  const {dimension, onChange} = props
  const onUpdateBase = base => onChange('base', base)
  return (
    <>
      <Form.Element label="Field Label">
        <Input
          type={InputType.Text}
          value={dimension.label}
          onChange={e => onChange('label', e.target.value)}
        />
      </Form.Element>
      <Form.Element label="Unit Prefix">
        <SelectGroup shape={ButtonShape.StretchToFit}>
          <SelectGroup.Option
            name="y-values-format"
            id="y-values-format-tab--raw"
            value=""
            active={dimension.base === ''}
            titleText="Do not format values using a unit prefix"
            onClick={onUpdateBase}
          >
            None
          </SelectGroup.Option>
          <SelectGroup.Option
            name="y-values-format"
            id="y-values-format-tab--kmb"
            value={BASE_10}
            active={dimension.base === BASE_10}
            titleText="Format values using an International System of Units prefix"
            onClick={onUpdateBase}
          >
            SI
          </SelectGroup.Option>
          <SelectGroup.Option
            name="y-values-format"
            id="y-values-format-tab--kmg"
            value={BASE_2}
            active={dimension.base === BASE_2}
            titleText="Format values using a binary unit prefix (for formatting bits or bytes)"
            onClick={onUpdateBase}
          >
            Binary
          </SelectGroup.Option>
        </SelectGroup>
      </Form.Element>
      <FormElement label={'Value unit prefix'}>
        <Input
          value={dimension.prefix}
          onChange={e => onChange('prefix', e.target.value)}
        />
      </FormElement>
      <FormElement label={'Value unit suffix'}>
        <Input
          value={dimension.suffix}
          onChange={e => onChange('suffix', e.target.value)}
        />
      </FormElement>
    </>
  )
}

export default DimensionValueDisplayProperties

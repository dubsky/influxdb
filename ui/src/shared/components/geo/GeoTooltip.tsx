import {FunctionComponent, useState} from 'react'
import {Tooltip} from '@influxdata/giraffe/src/components/Tooltip'
import {Config} from '@influxdata/giraffe/dist'
import React from 'react'

interface Props {
  stylingConfig: Partial<Config>
  onCreate
}

export const GeoTooltip: FunctionComponent<Props> = props => {
  const {stylingConfig, onCreate} = props
  const [tooltipData, setTooltipData] = useState(null)
  onCreate(setTooltipData)
  return (
    <>
      {tooltipData && (
        <Tooltip
          data={tooltipData}
          config={{
            ...(stylingConfig as Config),
            legendColumns: tooltipData.map(c => c.key),
          }}
        />
      )}
    </>
  )
}

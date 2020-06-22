// Libraries
import React, {FunctionComponent} from 'react'
import {SelectDropdown, ComponentStatus} from '@influxdata/clockface'

interface Props {
  selectedColumn: string
  availableColumns: string[]
  onSelectColumn: (col: string) => void
}

const FieldSelector: FunctionComponent<Props> = ({
  selectedColumn,
  onSelectColumn,
  availableColumns,
}) => {
  return (
    <SelectDropdown
      options={availableColumns}
      selectedOption={selectedColumn || 'Build a query before selecting...'}
      onSelect={onSelectColumn}
      buttonStatus={
        availableColumns.length == 0
          ? ComponentStatus.Disabled
          : ComponentStatus.Default
      }
    />
  )
}

export default FieldSelector

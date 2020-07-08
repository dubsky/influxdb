// Libraries
import {Table} from '@influxdata/giraffe'
import {keys, indexOf} from 'lodash'

// Types
import {GeoTable} from 'src/shared/components/geo/processing/GeoTable'
import {
  isPivotSensible,
  PivotedGeoTable,
} from 'src/shared/components/geo/processing/PivotedGeoTable'
import {NativeGeoTable} from 'src/shared/components/geo/processing/NativeGeoTable'

// Utils
import {getNumericColumns} from 'src/shared/utils/vis'
import {EmptyGeoTable} from './EmptyGeoTable'

// Constants
export const FIELD_COLUMN = '_field'
export const VALUE_COLUMN = '_value'
export const QUERY_META_COLUMNS = [
  FIELD_COLUMN,
  VALUE_COLUMN,
  'table',
  '_start',
  '_stop',
]

export const TIME_COLUMN = '_time'
export const START_COLUMN = '_start'
export const STOP_COLUMN = '_stop'
export const LON_COLUMN = 'lon'
export const LAT_COLUMN = 'lat'
export const GEO_HASH_COLUMN = 's2_cell_id'

export const preprocessData = (
  table: Table,
  rowLimit: number,
  autoPivoting: boolean,
  onFinalTable: (table: GeoTable) => void
) => {
  if (autoPivoting && isPivotSensible(table)) {
    // don't delay rendering with data calculation
    setTimeout(() => {
      onFinalTable(new PivotedGeoTable(table, rowLimit))
    }, 0)
    return new EmptyGeoTable()
  }
  return new NativeGeoTable(table, rowLimit)
}

export const getColumnNames = (
  table: Table,
  autoPivoting: boolean
): string[] => {
  if (autoPivoting) {
    return getFieldColumnValues(table)
  }
  return getNumericColumns(table)
}

const getFieldColumnValues = (table: Table): string[] => {
  const fieldColumn = table.getColumn(FIELD_COLUMN, 'string')
  const valueColumn = table.getColumn(VALUE_COLUMN)
  if (!fieldColumn) return []
  const entriesCount = fieldColumn.length
  const fieldNames = {}
  for (let i = 0; i < entriesCount; i++) {
    const fieldName = fieldColumn[i]
    if (typeof valueColumn[i] === 'number') fieldNames[fieldName] = true
  }
  return filterMetaColumns(keys(fieldNames))
}

export const filterMetaColumns = (fieldNames: string[]) => {
  return fieldNames.filter(name => indexOf(QUERY_META_COLUMNS, name) < 0)
}

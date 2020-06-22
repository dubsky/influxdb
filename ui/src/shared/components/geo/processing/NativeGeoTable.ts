// Libraries
import {Table} from '@influxdata/giraffe'

// Types
import {
  AbstractGeoTable,
  CoordinateEncoding,
} from 'src/shared/components/geo/processing/AbstractGeoTable'

// Constants
import {
  GEO_HASH_COLUMN,
  LAT_COLUMN,
  LON_COLUMN,
} from 'src/shared/components/geo/processing/tableProcessing'

export class NativeGeoTable extends AbstractGeoTable {
  table: Table
  maxRows: number

  constructor(table: Table, maxRows: number) {
    super(getDataEncoding(table))
    this.table = table
    this.maxRows = maxRows
  }

  getRowCount() {
    return Math.min(this.table.length, this.maxRows)
  }

  getValue(index: number, field: string): number {
    const column = this.table.getColumn(field)
    if (!column) return null
    return column[
      index * Math.max(1, Math.floor(this.table.length / this.maxRows))
    ] as number
  }

  getS2CellID(index: number): string {
    const column = this.table.getColumn(GEO_HASH_COLUMN)
    if (!column) return null
    const value = column[index]
    if (typeof value !== 'string') return null
    // this happens for geo hash only
    return value as string
  }

  isTruncated(): boolean {
    return this.table.length > this.maxRows
  }
}

const getDataEncoding = (table: Table): CoordinateEncoding => {
  if (
    table.getColumn(LON_COLUMN) !== null &&
    table.getColumn(LAT_COLUMN) !== null
  )
    return CoordinateEncoding.FIELDS
  if (table.getColumn(GEO_HASH_COLUMN) !== null)
    return CoordinateEncoding.GEO_HASH
  return CoordinateEncoding.GEO_HASH
}

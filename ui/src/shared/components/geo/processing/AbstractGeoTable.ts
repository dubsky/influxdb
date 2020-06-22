// Libraries
import {S2LatLng} from '@raha.group/s2-geometry'

// Constants
import {
  LAT_COLUMN,
  LON_COLUMN,
} from 'src/shared/components/geo/processing/tableProcessing'

// Types
import {GeoTable, LatLon} from 'src/shared/components/geo/processing/GeoTable'

export enum CoordinateEncoding {
  GEO_HASH,
  FIELDS,
}

export abstract class AbstractGeoTable implements GeoTable {
  coordinateEncoding: CoordinateEncoding

  protected constructor(coordinateEncoding: CoordinateEncoding) {
    this.coordinateEncoding = coordinateEncoding
  }

  abstract getRowCount()

  abstract getValue(index: number, field: string): number

  abstract getS2CellID(index: number): string

  abstract isTruncated(): boolean

  getLatLon(index: number): LatLon {
    if (this.coordinateEncoding === CoordinateEncoding.FIELDS) {
      return {
        lon: this.getValue(index, LON_COLUMN),
        lat: this.getValue(index, LAT_COLUMN),
      }
    } else {
      const cellId = this.getS2CellID(index)
      if (cellId === null || cellId.length > 16) return null
      const fixed =
        BigInt('0x' + cellId) * PRECISION_TRIMMING_TABLE[16 - cellId.length]
      const latLng = S2LatLng.fromInteger(fixed)
      return {
        lon: latLng.lng,
        lat: latLng.lat,
      }
    }
  }
}

const PRECISION_TRIMMING_TABLE = [BigInt(1)]
for (let i = 1; i < 17; i++) {
  PRECISION_TRIMMING_TABLE[i] = PRECISION_TRIMMING_TABLE[i - 1] * BigInt(16)
}

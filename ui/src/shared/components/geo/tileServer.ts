import {runQuery} from 'src/shared/apis/query'
import fromFlux from 'src/shared/utils/fromFlux'
import _ from 'lodash'

const OPEN_STREET_MAPS = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const QUERY_TILE_SERVER_SECRET =
  'import "influxdata/influxdb/secrets"\n' +
  'buckets() |> limit(n:1) |> map(fn: (r) => ({tileServer: secrets.get(key: "geo.tile.server.url"), bingKey: secrets.get(key: "geo.bing-maps.key")}))'
const DEFAULT_TILE_SERVER_CONFIGURATION = {tileServerUrl: OPEN_STREET_MAPS}

export interface TileServerConfigurations {
  tileServerUrl: string
  bingKey?: string
}

let tileServerConfigurations: TileServerConfigurations = null

export const getTileServerConfigurations: () => TileServerConfigurations = () => {
  return tileServerConfigurations
}

export const loadTileServerSecret = async (
  orgID: string
): Promise<TileServerConfigurations> => {
  if (tileServerConfigurations) return tileServerConfigurations
  try {
    const result = await runQuery(orgID, QUERY_TILE_SERVER_SECRET).promise
    if (result.type === 'SUCCESS') {
      const parsed = fromFlux(result.csv)
      tileServerConfigurations = {
        tileServerUrl: _.get(parsed, 'table.columns.tileServer.data[0]'),
        bingKey: _.get(parsed, 'table.columns.bingKey.data[0]'),
      }
      console.log('loaded tileServerConfigurations', tileServerConfigurations)
      if (
        tileServerConfigurations.tileServerUrl ||
        tileServerConfigurations.bingKey
      )
        return tileServerConfigurations
    }
  } catch (e) {
    console.error('Unable to load geo widget tile server configuration', e)
  }
  return DEFAULT_TILE_SERVER_CONFIGURATION
}

import {runQuery} from 'src/shared/apis/query'
import fromFlux from '../../utils/fromFlux'
import _ from 'lodash'

const OPEN_STREET_MAPS = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const QUERY_TILE_SERVER_SECRET =
  'import "influxdata/influxdb/secrets"\n' +
  'buckets() |> limit(n:1) |> map(fn: (r) => ({tileServer: secrets.get(key: "geo.tile.server.url") }))'

let tileServerUrl = null

export const getTileServerSecret = () => {
  return tileServerUrl
}

export const loadTileServerSecret = async (orgID: string) => {
  if (tileServerUrl) return tileServerUrl
  try {
    const result = await runQuery(orgID, QUERY_TILE_SERVER_SECRET).promise
    if (result.type === 'SUCCESS') {
      return _.get(
        fromFlux(result.csv),
        'table.columns.tileServer.data[0]',
        OPEN_STREET_MAPS
      )
    }
  } catch (e) {
    return OPEN_STREET_MAPS
  }
}

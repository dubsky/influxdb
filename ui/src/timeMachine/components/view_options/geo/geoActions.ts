// Types
import {Action} from 'src/timeMachine/actions'
import {Color, VariableAssignment} from 'src/types'
import {GeoViewLayer} from 'src/client'

interface SetZoom {
  type: 'SET_ZOOM'
  payload: {zoom: number}
}

export const setZoom = (zoom: number): SetZoom => ({
  type: 'SET_ZOOM',
  payload: {zoom},
})

interface SetLongitude {
  type: 'SET_LONGITUDE'
  payload: {lon: number}
}

export const setLongitude = (lon: number): SetLongitude => ({
  type: 'SET_LONGITUDE',
  payload: {lon},
})

interface SetLatitude {
  type: 'SET_LATITUDE'
  payload: {lat: number}
}

export const setLatitude = (lat: number): SetLatitude => ({
  type: 'SET_LATITUDE',
  payload: {lat},
})

interface SetAllowPanAndZoom {
  type: 'SET_ALLOW_PAN_AND_ZOOM'
  payload: {allowPanAndZoom: boolean}
}

export const setAllowPanAndZoom = (
  allowPanAndZoom: boolean
): SetAllowPanAndZoom => ({
  type: 'SET_ALLOW_PAN_AND_ZOOM',
  payload: {allowPanAndZoom},
})

interface SetMapStyle {
  type: 'SET_MAP_STYLE'
  payload: {mapStyle: string}
}

export const setMapStyle = (mapStyle: string): SetMapStyle => ({
  type: 'SET_MAP_STYLE',
  payload: {mapStyle},
})

interface SetDetectCoordinateFields {
  type: 'SET_DETECT_COORDINATE_FIELDS'
  payload: {detectCoordinateFields: boolean}
}

export const setDetectCoordinateFields = (
  detectCoordinateFields: boolean
): SetDetectCoordinateFields => ({
  type: 'SET_DETECT_COORDINATE_FIELDS',
  payload: {detectCoordinateFields},
})

interface SetViewport {
  type: 'SET_VIEWPORT'
  payload: {lat: number; lon: number; zoom: number}
}

export const setViewport = (
  lat: number,
  lon: number,
  zoom: number
): SetViewport => ({
  type: 'SET_VIEWPORT',
  payload: {lat, lon, zoom},
})

interface SetField {
  type: 'SET_FIELD'
  payload: {fieldName: string; field: string | number | boolean; layer: number}
}

export const setField = (
  fieldName: string,
  field: string | number | boolean,
  layer: number
): SetField => ({
  type: 'SET_FIELD',
  payload: {fieldName, field, layer},
})

interface SetLayerColors {
  type: 'SET_GEO_LAYER_COLORS'
  payload: {colors: Color[]; layer: number}
}

export const setLayerColors = (
  colors: Color[],
  layer: number
): SetLayerColors => ({
  type: 'SET_GEO_LAYER_COLORS',
  payload: {colors, layer},
})

interface SetRadius {
  type: 'SET_RADIUS'
  payload: {radius: number; layer: number}
}

export const setRadius = (radius: number, layer: number): SetRadius => ({
  type: 'SET_RADIUS',
  payload: {radius, layer},
})

interface SetDimensionProperty {
  type: 'SET_DIMENSION_PROPERTY'
  payload: {layer: number; dimension: string; property: string; value: string}
}

export const setDimensionProperty = (
  layer: number,
  dimension: string,
  property: string,
  value: string
): SetDimensionProperty => ({
  type: 'SET_DIMENSION_PROPERTY',
  payload: {layer, dimension, property, value},
})

interface AddGeoLayer {
  type: 'ADD_GEO_LAYER'
  payload: {layer: GeoViewLayer}
}

export const addGeoLayer = (layer: GeoViewLayer): AddGeoLayer => ({
  type: 'ADD_GEO_LAYER',
  payload: {layer},
})

interface RemoveGeoLayer {
  type: 'REMOVE_GEO_LAYER'
  payload: {layerId: number}
}

export const removeGeoLayer = (layerId: number): RemoveGeoLayer => ({
  type: 'REMOVE_GEO_LAYER',
  payload: {layerId},
})

interface SetViewVariableAssignment {
  type: 'SET_VIEW_VARIABLE_ASSIGNMENT'
  payload: {assignment: VariableAssignment[]}
}

export const setViewVariableAssignment = (
  assignment: VariableAssignment[]
): SetViewVariableAssignment => ({
  type: 'SET_VIEW_VARIABLE_ASSIGNMENT',
  payload: {assignment},
})

export type GeoChartAction =
  | SetZoom
  | SetLatitude
  | SetLongitude
  | SetViewport
  | SetLayerColors
  | SetRadius
  | SetField
  | SetDimensionProperty
  | SetAllowPanAndZoom
  | SetDetectCoordinateFields
  | AddGeoLayer
  | RemoveGeoLayer
  | SetViewVariableAssignment
  | SetMapStyle

const GEO_ACTIONS = [
  'SET_VIEW_VARIABLE_ASSIGNMENT',
  'SET_ZOOM',
  'SET_LATITUDE',
  'SET_LONGITUDE',
  'SET_VIEWPORT',
  'SET_GEO_LAYER_COLORS',
  'SET_RADIUS',
  'SET_FIELD',
  'SET_DIMENSION_PROPERTY',
  'SET_DETECT_COORDINATE_FIELDS',
  'SET_ALLOW_PAN_AND_ZOOM',
  'ADD_GEO_LAYER',
  'REMOVE_GEO_LAYER',
  'SET_MAP_STYLE',
]

const actionMap = GEO_ACTIONS.reduce((acc, a) => ({...acc, [a]: true}), {})

export const isGeoAction = (action: Action): action is GeoChartAction => {
  return actionMap[action.type]
}

// Libraries
import produce from 'immer'

// Types
import {ExtractWorkingView, GeoViewProperties} from 'src/types'
import {Action} from 'src/timeMachine/actions'
import {TimeMachineState} from 'src/timeMachine/reducers'

type WithCenterLocation = {
  center: {
    lat: number
    lon: number
  }
}

export const geoTimeMachineReducer = (
  state: TimeMachineState,
  action: Action
): TimeMachineState => {
  switch (action.type) {
    case 'SET_ZOOM': {
      const {zoom} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<
          typeof action.payload
        >
        view.properties.zoom = zoom
      })
    }
    case 'SET_LATITUDE': {
      const {lat} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<WithCenterLocation>
        view.properties.center.lat = lat
      })
    }
    case 'SET_LONGITUDE': {
      const {lon} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<WithCenterLocation>
        view.properties.center.lon = lon
      })
    }
    case 'SET_MAP_STYLE': {
      const {mapStyle} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as any/*as ExtractWorkingView<
          typeof action.payload
          >*/
        view.properties.mapStyle = mapStyle
      })
    }
    case 'SET_ALLOW_PAN_AND_ZOOM': {
      const {allowPanAndZoom} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<
          typeof action.payload
        >
        view.properties.allowPanAndZoom = allowPanAndZoom
      })
    }
    case 'SET_DETECT_COORDINATE_FIELDS': {
      const {detectCoordinateFields} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<
          typeof action.payload
        >
        view.properties.detectCoordinateFields = detectCoordinateFields
      })
    }
    case 'SET_LONGITUDE': {
      const {lon} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<WithCenterLocation>
        view.properties.center.lon = lon
      })
    }
    case 'SET_VIEWPORT': {
      const {lon, lat, zoom} = action.payload
      return produce(state, draftState => {
        const properties = (draftState.view as ExtractWorkingView<
          WithCenterLocation
        >).properties
        properties.center = {lon, lat}
        properties.zoom = zoom
      })
    }
    case 'SET_RADIUS': {
      const {radius, layer} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<
          Pick<GeoViewProperties, 'layers'>
        >
        const layers = view.properties.layers
        layers[layer] = {...layers[layer], radius}
      })
    }
    case 'SET_FIELD': {
      const {fieldName, field, layer} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<
          Pick<GeoViewProperties, 'layers'>
        >
        const layers = view.properties.layers
        layers[layer] = {...layers[layer], [fieldName]: field}
      })
    }
    case 'SET_DIMENSION_PROPERTY': {
      const {layer, dimension, property, value} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<
          Pick<GeoViewProperties, 'layers'>
        >
        const layerProperties = view.properties.layers[layer]
        layerProperties[dimension] = {
          ...layerProperties[dimension],
          [property]: value,
        }
      })
    }
    case 'SET_GEO_LAYER_COLORS': {
      const {layer, colors} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<
          Pick<GeoViewProperties, 'layers'>
        >
        const layers = view.properties.layers
        layers[layer] = {...layers[layer], colors}
      })
    }
    case 'ADD_GEO_LAYER': {
      const {layer} = action.payload
      return produce(state, draftState => {
        const view = draftState.view as ExtractWorkingView<
          Pick<GeoViewProperties, 'layers'>
        >
        view.properties.layers.push(layer)
      })
    }
    case 'SET_VIEW_VARIABLE_ASSIGNMENT': {
      const {assignment} = action.payload
      return produce(state, draftState => {
        draftState.viewVariablesAssignment = assignment
      })
    }
  }
  return state
}

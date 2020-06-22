// Libraries
import {get} from 'lodash'
// Utils
import {getActiveQuery, getActiveTimeMachine} from 'src/timeMachine/selectors'
import {getRangeVariable} from 'src/variables/utils/getTimeRangeVars'
import {getTimeRange, getTimeRangeWithTimezone} from 'src/dashboards/selectors'
import {getWindowPeriodVariable} from 'src/variables/utils/getWindowVars'
import {
  TIME_RANGE_START,
  TIME_RANGE_STOP,
  WINDOW_PERIOD,
} from 'src/variables/constants'
import {currentContext} from 'src/shared/selectors/currentContext'
// Types
import {
  AppState,
  CSVArguments,
  MapArguments,
  QueryArguments,
  RemoteDataState,
  Variable,
  VariableArgumentType,
} from 'src/types'
import {VariableAssignment} from 'src/types/ast'
import {GEO_VARIABLES} from 'src/shared/components/geo/GeoChart'
import produce from 'immer'
import {TimeMachineState} from 'src/timeMachine/reducers'

export const extractVariableEditorName = (state: AppState): string => {
  return state.variableEditor.name
}

export const extractVariableEditorType = (
  state: AppState
): VariableArgumentType => {
  return state.variableEditor.selected
}

export const extractVariableEditorQuery = (state: AppState): QueryArguments => {
  return (
    state.variableEditor.argsQuery || {
      type: 'query',
      values: {
        query: '',
        language: 'flux',
      },
    }
  )
}

export const extractVariableEditorMap = (state: AppState): MapArguments => {
  return (
    state.variableEditor.argsMap || {
      type: 'map',
      values: {},
    }
  )
}

export const extractVariableEditorConstant = (
  state: AppState
): CSVArguments => {
  return (
    state.variableEditor.argsConstant || {
      type: 'constant',
      values: [],
    }
  )
}

export const getUserVariableNames = (
  state: AppState,
  contextID: string
): string[] => {
  const allIDs = get(state, ['resources', 'variables', 'allIDs'], [])
  const contextIDs = get(
    state,
    ['resources', 'variables', 'values', contextID, 'order'],
    []
  )

  return contextIDs
    .filter(v => allIDs.includes(v))
    .concat(allIDs.filter(v => !contextIDs.includes(v)))
}

// this function grabs all user defined variables
// and hydrates them based on their context
export const getVariables = (
  state: AppState,
  contextID?: string
): Variable[] => {
  const vars = getUserVariableNames(state, contextID || currentContext(state))
    .reduce((prev, curr) => {
      prev.push(getVariable(state, curr))

      return prev
    }, [])
    .filter(v => !!v)

  return vars
}

enum ViewVariableNames {
  GEO_VIEW_LON = 'geo-view-lon',
  GEO_VIEW_LAT = 'geo-view-lat',
  GEO_VIEW_RADIUS = 'radius',
}

const getViewVariablesIDs = (state: AppState): string[] => {
  const timeMachine = getActiveTimeMachine(state)
  const type = timeMachine.view.properties.type
  switch (type) {
    case 'geo':
      return [
        ViewVariableNames.GEO_VIEW_LON,
        ViewVariableNames.GEO_VIEW_LAT,
        ViewVariableNames.GEO_VIEW_RADIUS,
      ]
    default:
      return []
  }
}

const buildViewVariable = (id, name) => ({
  orgID: '',
  id: id,
  name: name,
  status: RemoteDataState.Done,
  labels: [],
  arguments: {type: 'system'},
})

const VIEW_VARIABLES = {
  [ViewVariableNames.GEO_VIEW_LON]: buildViewVariable(
    ViewVariableNames.GEO_VIEW_LON,
    GEO_VARIABLES.LON
  ),
  [ViewVariableNames.GEO_VIEW_LAT]: buildViewVariable(
    ViewVariableNames.GEO_VIEW_LAT,
    GEO_VARIABLES.LAT
  ),
  [ViewVariableNames.GEO_VIEW_RADIUS]: buildViewVariable(
    ViewVariableNames.GEO_VIEW_RADIUS,
    GEO_VARIABLES.RADIUS
  ),
}

// the same as the above method, but includes system
// variables
export const getAllVariables = (
  state: AppState,
  contextID?: string
): Variable[] => {
  const vars = getUserVariableNames(state, contextID || currentContext(state))
    .concat([TIME_RANGE_START, TIME_RANGE_STOP, WINDOW_PERIOD])
    .concat(getViewVariablesIDs(state))
    .reduce((prev, curr) => {
      prev.push(getVariable(state, curr))
      return prev
    }, [])
    .filter(v => !!v)
  return vars
}

const getStateViewVariableValue = (
  timeMachineState: TimeMachineState,
  variableID: string
) => {
  const {viewVariablesAssignment} = timeMachineState
  if (viewVariablesAssignment) {
    const assignment = viewVariablesAssignment.find(
      assignment => assignment.id.name === variableID
    )
    if (assignment && assignment.init.type === 'FloatLiteral') {
      return assignment.init.value
    }
  }
  return null
}

export const sortVariablesByName = (variables: Variable[]): Variable[] =>
  variables.sort((a, b) =>
    a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
  )

export const getVariable = (state: AppState, variableID: string): Variable => {
  const contextID = currentContext(state)
  const ctx = get(state, ['resources', 'variables', 'values', contextID])
  let vari = get(state, ['resources', 'variables', 'byID', variableID])

  if (ctx && ctx.values && ctx.values.hasOwnProperty(variableID)) {
    vari = {...vari, ...ctx.values[variableID]}
  }

  if (variableID === TIME_RANGE_START || variableID === TIME_RANGE_STOP) {
    const timeRange = getTimeRangeWithTimezone(state)
    vari = getRangeVariable(variableID, timeRange)
  }

  if (variableID === WINDOW_PERIOD) {
    const {text} = getActiveQuery(state)
    const variables = getVariables(state)
    const range = getTimeRange(state)
    const timeVars = [
      getRangeVariable(TIME_RANGE_START, range),
      getRangeVariable(TIME_RANGE_STOP, range),
    ].map(v => asAssignment(v))

    const assignments = variables.reduce((acc, curr) => {
      if (!curr.name || !curr.selected) {
        return acc
      }

      return [...acc, asAssignment(curr)]
    }, timeVars)

    vari = (getWindowPeriodVariable(text, assignments) || [])[0]
  }

  if (!vari && VIEW_VARIABLES[variableID]) {
    vari = produce(VIEW_VARIABLES[variableID], draft => {
      draft.arguments.values = getStateViewVariableValue(
        getActiveTimeMachine(state),
        VIEW_VARIABLES[variableID].name
      )
    })
  }

  if (!vari) {
    return vari
  }

  if (vari.arguments.type === 'query') {
    if (!ctx || !ctx.values || !ctx.values.hasOwnProperty(variableID)) {
      // TODO load that ish for the context
      // hydrateQueries(state, contextID, variableID)
    }
  }

  // Now validate that the selected value makes sense for
  // the current situation
  const vals = normalizeValues(vari)
  vari = {...vari}
  if (
    !vari.selected ||
    (vari.selected && vari.selected.length && !vals.includes(vari.selected[0]))
  ) {
    vari.selected = []
  }

  if (!vari.selected.length && vals.length) {
    vari.selected.push(vals[0])
  }

  return vari
}

export const normalizeValues = (variable: Variable): string[] => {
  switch (variable.arguments.type) {
    case 'query':
      return variable.arguments.values.results || []
    case 'map':
      return Object.keys(variable.arguments.values) || []
    case 'constant':
      return variable.arguments.values || []
    default:
      return []
  }
}

export const asAssignment = (variable: Variable): VariableAssignment => {
  const out = {
    type: 'VariableAssignment' as const,
    id: {
      type: 'Identifier' as const,
      name: variable.name,
    },
  } as VariableAssignment

  if (variable.arguments.type === 'system') {
    out.init = {
      type: 'FloatLiteral',
      value: variable.arguments.values,
    }
  }

  if (variable.id === WINDOW_PERIOD) {
    out.init = {
      type: 'DurationLiteral',
      values: [{magnitude: variable.arguments.values[0] || 10000, unit: 'ms'}],
    }

    return out
  }

  if (variable.id === TIME_RANGE_START || variable.id === TIME_RANGE_STOP) {
    const val = variable.arguments.values[0]

    if (!isNaN(Date.parse(val))) {
      out.init = {
        type: 'DateTimeLiteral',
        value: new Date(val).toISOString(),
      }
    } else if (val === 'now()') {
      out.init = {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'now',
        },
      }
    } else if (val) {
      out.init = {
        type: 'UnaryExpression',
        operator: '-',
        argument: {
          type: 'DurationLiteral',
          values: val,
        },
      }
    }
    return out
  }

  if (variable.arguments.type === 'map') {
    if (!variable.selected) {
      variable.selected = [Object.keys(variable.arguments.values)[0]]
    }
    out.init = {
      type: 'StringLiteral',
      value: variable.arguments.values[variable.selected[0]],
    }
  }

  if (variable.arguments.type === 'constant') {
    if (!variable.selected) {
      variable.selected = [variable.arguments.values[0]]
    }
    out.init = {
      type: 'StringLiteral',
      value: variable.selected[0],
    }
  }

  if (variable.arguments.type === 'query') {
    if (!variable.selected || !variable.selected[0]) {
      out.init = {
        type: 'StringLiteral',
        value: '',
      }
    } else {
      out.init = {
        type: 'StringLiteral',
        value: variable.selected[0],
      }
    }
  }

  if (!out.init) return null

  return out
}

// TODO kill this function
export const getTimeMachineValuesStatus = (
  state: AppState
): RemoteDataState => {
  const activeTimeMachineID = state.timeMachines.activeTimeMachineID
  const valuesStatus = get(
    state,
    `resources.variables.values.${activeTimeMachineID}.status`
  )

  return valuesStatus
}

// TODO kill this function
export const getDashboardVariablesStatus = (
  state: AppState
): RemoteDataState => {
  return get(state, 'resources.variables.status')
}

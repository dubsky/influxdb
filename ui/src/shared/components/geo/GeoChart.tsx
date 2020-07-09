// Libraries
import React, {Component} from 'react'
import {AutoSizer} from 'react-virtualized'
import {Table} from '@influxdata/giraffe'
import {connect} from 'react-redux'

// Components
import Geo from 'src/shared/components/geo/Geo'

// Types
import {GeoViewProperties} from 'src/types/dashboards'
import {AppState, Theme} from 'src/types'
import {VariableAssignment} from 'src/types'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'
import {
  setViewport,
  setViewVariableAssignment,
} from 'src/timeMachine/components/view_options/geo/geoActions'
import {getActiveTimeMachine} from 'src/timeMachine/selectors'
import {
  getTileServerConfigurations,
  loadTileServerSecret,
  TileServerConfigurations,
} from 'src/shared/components/geo/tileServer'
import {executeQueries} from 'src/timeMachine/actions/queries'
import {getOrg} from 'src/organizations/selectors'

// Constants
import {VIS_THEME, VIS_THEME_LIGHT} from 'src/shared/constants'

export enum GEO_VARIABLES {
  LON = 'lon',
  LAT = 'lat',
  RADIUS = 'radius',
}

interface OwnProps {
  table: Table
  properties: GeoViewProperties
  isInConfigurationMode: boolean
  onViewVariablesReady: (variables: VariableAssignment[]) => void
  theme: Theme
}

interface StateProps {
  isViewingVisOptions: boolean
  orgID: string
}

interface DispatchProps {
  onUpdateViewport: (lat: number, lon: number, zoom: number) => void
  onUpdateVariableAssignment: (assignment: VariableAssignment[]) => void
  onRefreshQuery: typeof executeQueries
}

interface State {
  tileServerConfiguration: TileServerConfigurations
}

@ErrorHandling
class GeoChart extends Component<OwnProps & DispatchProps & StateProps, State> {
  private widthOnLastRender = null
  private heightOnLastRender = null
  private latOnLastRender = null
  private lonOnLastRender = null
  private zoomOnLastRender = null
  private skipNextRender = false

  constructor(props) {
    super(props)
    const configuration = getTileServerConfigurations()
    this.state = {tileServerConfiguration: configuration}
    if (!configuration) {
      loadTileServerSecret(this.props.orgID).then(configuration => {
        this.setState({tileServerConfiguration: configuration})
      })
    }
  }

  private static calculateVariableAssignment(
    width: number,
    height: number,
    lon: number,
    lat: number,
    zoom: number
  ): VariableAssignment[] {
    const pixelRadius = Math.sqrt(width * width + height * height) / 2
    // circumference of earth = 40075016.686m
    const metersPerPixel =
      (40075016.686 * Math.abs(Math.cos((lat * Math.PI) / 180))) /
      Math.pow(2, zoom + 8)
    return [
      {
        type: 'VariableAssignment',
        id: {type: 'Identifier', name: GEO_VARIABLES.LON},
        init: {type: 'FloatLiteral', value: lon},
      },
      {
        type: 'VariableAssignment',
        id: {type: 'Identifier', name: GEO_VARIABLES.LAT},
        init: {type: 'FloatLiteral', value: lat},
      },
      {
        type: 'VariableAssignment',
        id: {type: 'Identifier', name: GEO_VARIABLES.RADIUS},
        init: {
          type: 'FloatLiteral',
          value: (pixelRadius * metersPerPixel) / 1000,
        },
      },
    ]
  }

  shouldComponentUpdate(): boolean {
    const {skipNextRender} = this
    if (skipNextRender) {
      this.skipNextRender = false
      return false
    }
    return true
  }

  private updateQuery = (width, height, lat, lon, zoom) => {
    const {
      isInConfigurationMode,
      onRefreshQuery,
      onViewVariablesReady,
      onUpdateVariableAssignment,
    } = this.props
    const {
      widthOnLastRender,
      heightOnLastRender,
      latOnLastRender,
      lonOnLastRender,
      zoomOnLastRender,
    } = this
    if (
      width &&
      height &&
      (widthOnLastRender !== width ||
        heightOnLastRender !== height ||
        latOnLastRender !== lat ||
        lonOnLastRender !== lon ||
        zoomOnLastRender !== zoom)
    ) {
      const variableAssignment = GeoChart.calculateVariableAssignment(
        width,
        height,
        lon,
        lat,
        zoom
      )
      // the query update may change state and updateQuery might be called
      // from render
      setTimeout(() => {
        if (isInConfigurationMode) {
          onUpdateVariableAssignment(variableAssignment)
          onRefreshQuery()
        } else {
          onViewVariablesReady && onViewVariablesReady(variableAssignment)
        }
      }, 0)
      this.latOnLastRender = lat
      this.lonOnLastRender = lon
      this.zoomOnLastRender = zoom
      this.widthOnLastRender = width
      this.heightOnLastRender = height
    }
  }

  private onViewportChange = (lat, lon, zoom) => {
    const {isInConfigurationMode, properties} = this.props
    if (isInConfigurationMode) this.skipNextRender = true
    if (isInConfigurationMode || properties.allowPanAndZoom) {
      this.props.onUpdateViewport(lat, lon, zoom)
    }
    this.updateQuery(
      this.widthOnLastRender,
      this.heightOnLastRender,
      lat,
      lon,
      zoom
    )
  }

  private onAutoResize = ({width, height}) => {
    const {properties, theme, table, isInConfigurationMode} = this.props
    const {layers, zoom, allowPanAndZoom, detectCoordinateFields} = properties
    const {lat, lon} = properties.center
    const config = theme === 'light' ? VIS_THEME_LIGHT : VIS_THEME
    const {
      latOnLastRender,
      lonOnLastRender,
      zoomOnLastRender,
      onViewportChange,
    } = this

    this.updateQuery(
      width,
      height,
      latOnLastRender === null ? lat : latOnLastRender,
      this.lonOnLastRender === null ? lon : lonOnLastRender,
      zoomOnLastRender === null ? zoom : zoomOnLastRender
    )
    return (
      <div className="geo">
        <Geo
          width={width}
          height={height}
          table={table}
          lat={lat}
          lon={lon}
          zoom={zoom}
          isViewportEditable={isInConfigurationMode || allowPanAndZoom}
          detectCoordinateFields={detectCoordinateFields}
          layers={layers}
          stylingConfig={config}
          onViewportChange={onViewportChange}
          tileServerUrl={this.state.tileServerConfiguration.tileServerUrl}
          bingKey={this.state.tileServerConfiguration.bingKey}
        />
      </div>
    )
  }

  public render() {
    if (this.state.tileServerConfiguration) {
      return <AutoSizer>{this.onAutoResize.bind(this)}</AutoSizer>
    }
    return null
  }
}

const mapDispatchToProps: DispatchProps = {
  onUpdateViewport: setViewport,
  onUpdateVariableAssignment: setViewVariableAssignment,
  onRefreshQuery: executeQueries,
}

const mapStateToProps = (state: AppState): StateProps => {
  const {isViewingVisOptions} = getActiveTimeMachine(state)
  const orgID = getOrg(state).id
  return {
    orgID,
    isViewingVisOptions,
  }
}

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps
)(GeoChart)

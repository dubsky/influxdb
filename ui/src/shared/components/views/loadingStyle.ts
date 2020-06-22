// Types
import {QueryViewProperties} from 'src/types'

// View may define variables where the values depend on rendered viewport size
// Geo is such a one.
export const providesViewVariablesAfterRender = (
  properties: QueryViewProperties
): boolean => {
  switch (properties.type) {
    case 'geo':
      return true
    default:
      return false
  }
}

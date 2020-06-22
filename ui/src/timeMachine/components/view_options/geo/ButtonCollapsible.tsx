// Libraries
import React from 'react'
import {FunctionComponent, ReactNode, useState} from 'react'
import {Button, ButtonShape} from '@influxdata/clockface'

interface Props {
  className: string
  passiveText: string
  activeText: string
  sectionTitle: string
  contents: ReactNode
}

export const ButtonCollapsible: FunctionComponent<Props> = props => {
  const [active, setActive] = useState(false)
  const {contents, className, sectionTitle} = props
  return active ? (
    <>
      <h5 className="view-options--header">
        {sectionTitle}
        <Button
          className={`active ${className}`}
          shape={ButtonShape.Default}
          text={props.activeText}
          onClick={() => {
            setActive(!active)
          }}
        />
      </h5>
      {contents}
    </>
  ) : (
    <Button
      className={`passive ${className}`}
      shape={ButtonShape.Default}
      text={props.passiveText}
      onClick={() => {
        setActive(!active)
      }}
    />
  )
}

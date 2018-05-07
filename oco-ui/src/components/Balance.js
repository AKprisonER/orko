import React from "react"

import styled from "styled-components"
import Price from "./primitives/Price"
import Section from "./primitives/Section"
import Para from "./primitives/Para"

const Container = styled.div`
  display: flex;
  justify-content: space-between;
`

export const Balance = props => {
  const coin = props.coin

  const noBalance =
    !props.balance || !props.coin || !props.balance[coin.base] || !props.balance[coin.counter]
  var content = undefined
  if (coin) {
    content = (
      <Container>
        <Price fontSize={1} name="Total" onClick={props.onClickNumber}>
          {noBalance ? undefined : props.balance[coin.base].total}
        </Price>
        <Price fontSize={1} name="Available" onClick={props.onClickNumber}>
          {noBalance ? undefined : props.balance[coin.base].available}
        </Price>
        <Price
          fontSize={1}
          counter={coin.counter}
          name={coin.counter + " total"}
          onClick={props.onClickNumber}
        >
          {noBalance ? undefined : props.balance[coin.counter].total}
        </Price>
        <Price
          fontSize={1}
          counter={coin.counter}
          name={coin.counter + " available"}
          onClick={props.onClickNumber}
        >
          {noBalance ? undefined : props.balance[coin.counter].available}
        </Price>
        <Price fontSize={1} name="Can buy" onClick={props.onClickNumber}>
          {noBalance || !props.ticker
            ? undefined
            : props.balance[coin.counter].available / props.ticker.ask}
        </Price>
      </Container>
    )
  } else {
    content = <Para>No coin selected</Para>
  }
  return (
    <Section id="balance" heading="Balances">
      {content}
    </Section>
  )
}

export default Balance

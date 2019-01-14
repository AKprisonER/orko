/*
 * Orko
 * Copyright © 2018-2019 Graham Crockford
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import React from "react"
import { connect } from "react-redux"
import OpenOrders from "../components/OpenOrders"
import AuthenticatedOnly from "./AuthenticatedOnly"
import WithCoin from "./WithCoin"
import WhileLoading from "../components/WhileLoading"
import * as coinActions from "../store/coin/actions"
import * as jobActions from "../store/job/actions"
import { getOrdersForSelectedCoin } from "../selectors/coins"

class OpenOrdersContainer extends React.Component {
  onCancelExchange = (id, orderType, coin) => {
    this.props.dispatch(coinActions.cancelOrder(coin, id, orderType))
  }

  onCancelServer = jobId => {
    this.props.dispatch(jobActions.deleteJob({ id: jobId }))
  }

  render() {
    return (
      <AuthenticatedOnly padded>
        <WithCoin padded>
          {coin => (
            <WhileLoading data={this.props.orders} padded>
              {() => (
                <OpenOrders
                  orders={this.props.orders}
                  onCancelExchange={(id, orderType) =>
                    this.onCancelExchange(id, orderType, coin)
                  }
                  onCancelServer={this.onCancelServer}
                  onWatch={this.onWatch}
                  coin={coin}
                />
              )}
            </WhileLoading>
          )}
        </WithCoin>
      </AuthenticatedOnly>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    orders: getOrdersForSelectedCoin(state)
  }
}

export default connect(mapStateToProps)(OpenOrdersContainer)

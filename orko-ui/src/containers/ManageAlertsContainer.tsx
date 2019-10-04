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
import React, { useContext } from "react"
import { connect } from "react-redux"
import Section, { Provider as SectionProvider } from "../components/primitives/Section"
import Window from "../components/primitives/Window"
import CreateAlertContainer from "./CreateAlertContainer"
import * as jobActions from "../store/job/actions"
import { isAlert } from "../util/jobUtils"
import { AuthContext } from "@orko-ui-auth/index"
import Alerts from "components/Alerts"
import { FrameworkContext } from "FrameworkContainer"

interface ManageAlertsProps {
  mobile: boolean
}

interface ManageAlertsConnectedProps extends ManageAlertsProps {
  jobs
  dispatch
}

const ManageAlertsContainer: React.FC<ManageAlertsConnectedProps> = props => {
  const authApi = useContext(AuthContext)
  const frameworkApi = useContext(FrameworkContext)

  const coin = frameworkApi.alertsCoin
  if (!coin) return null
  const alerts = props.jobs.filter(
    job =>
      isAlert(job) &&
      job.tickTrigger.exchange === coin.exchange &&
      job.tickTrigger.base === coin.base &&
      job.tickTrigger.counter === coin.counter
  )
  return (
    <Window mobile={props.mobile} large={false}>
      <SectionProvider
        value={{
          draggable: !props.mobile,
          onHide: () => frameworkApi.setAlertsCoin(null)
        }}
      >
        <Section id="manageAlerts" heading={"Manage alerts for " + coin.name}>
          <Alerts alerts={alerts} onDelete={job => props.dispatch(jobActions.deleteJob(authApi, job))} />
          <CreateAlertContainer coin={coin} />
        </Section>
      </SectionProvider>
    </Window>
  )
}

function mapStateToProps(state) {
  return {
    jobs: state.job.jobs
  }
}

export default connect(mapStateToProps)(ManageAlertsContainer)
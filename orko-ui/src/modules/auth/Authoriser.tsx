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
import React, {
  useState,
  useEffect,
  ReactElement,
  useCallback,
  useMemo
} from "react"
import { Loader, Dimmer } from "semantic-ui-react"
import Whitelisting from "./Whitelisting"
import Login from "./Login"
import LoginDetails from "./LoginDetails"
import authService from "./auth"
import { setXsrfToken, clearXsrfToken } from "@orko-ui-common/util/fetchUtil"
import { AuthContext, AuthApi } from "./AuthContext"

interface AuthorizerProps {
  children: ReactElement
}

/**
 * Self-contained authorisation/login component. Displays child components
 * only if authorised, otherwise shows the relevant login components.
 *
 * Provides a context API for logging out and performing API calls, handling
 * authentication errors by logging out.
 *
 * @param props
 */
const Authorizer: React.FC<AuthorizerProps> = (props: AuthorizerProps) => {
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [whitelisted, setWhitelisted] = useState(false)
  const [error, setError] = useState<string>(undefined)
  const authorised = whitelisted && loggedIn

  const checkConnected = useCallback(
    () =>
      (async function(): Promise<boolean> {
        console.log("Testing access")
        const success: boolean = await authService.checkLoggedIn()
        if (success) {
          console.log("Logged in")
        } else {
          console.log("Not logged in")
        }
        if (success) {
          setWhitelisted(true)
          setLoggedIn(true)
          setError(null)
        }
        return success
      })(),
    []
  )

  const onWhitelist = useMemo(
    () =>
      async function(token: string): Promise<void> {
        try {
          console.log("Checking whitelist")
          await authService.whitelist(token)
          console.log("Accepted whitelist")
          setWhitelisted(true)
          setError(null)
          await checkConnected()
        } catch (error) {
          console.log(error.message)
          setWhitelisted(false)
          setError(`Whitelisting failed: ${error.message}`)
        }
      },
    [checkConnected]
  )

  const onLogin = useMemo(
    () =>
      async function(details: LoginDetails): Promise<void> {
        authService
          .simpleLogin(details)
          .then(({ expiry, xsrf }) => {
            try {
              console.log("Setting XSRF token")
              setXsrfToken(xsrf)
            } catch (error) {
              throw new Error("Malformed access token")
            }
            setLoggedIn(true)
            setError(null)
          })
          .then(checkConnected)
          .catch(error => {
            console.log(`Login failed: ${error.message}`)
            setError(error.message)
          })
      },
    [checkConnected]
  )

  const clearWhitelisting = useMemo(
    () =>
      async function(): Promise<void> {
        console.log("Clearing whitelist")
        try {
          await authService.clearWhiteList()
        } catch (error) {
          console.log(error.message)
          return
        }
        setWhitelisted(false)
      },
    []
  )

  const logout = useMemo(
    () =>
      function(): void {
        console.log("Logging out")
        clearXsrfToken()
        setLoggedIn(false)
      },
    []
  )

  const wrappedRequest = useMemo(
    () => (apiRequest, jsonHandler, errorHandler, onSuccess) => {
      return async (dispatch, getState) => {
        try {
          // Dispatch the request
          const response = await apiRequest()
          if (!response.ok) {
            if (response.status === 403) {
              console.log("Failed API request due to invalid whitelisting")
              clearWhitelisting()
            } else if (response.status === 401) {
              console.log("Failed API request due to invalid token/XSRF")
              logout()
            } else if (response.status !== 200) {
              // Otherwise, it's an unexpected error
              var errorMessage = null
              try {
                errorMessage = (await response.json()).message
              } catch (err) {
                // No-op
              }
              if (!errorMessage) {
                errorMessage = response.statusText
                  ? response.statusText
                  : "Server error (" + response.status + ")"
              }
              throw new Error(errorMessage)
            }
          } else {
            if (jsonHandler) dispatch(jsonHandler(await response.json()))
            if (onSuccess) dispatch(onSuccess())
          }
        } catch (error) {
          if (errorHandler) dispatch(errorHandler(error))
        }
      }
    },
    [clearWhitelisting, logout]
  )

  const api: AuthApi = useMemo(
    () => ({ authorised, logout, clearWhitelisting, wrappedRequest }),
    [authorised, logout, clearWhitelisting, wrappedRequest]
  )

  // On mount, go through a full connection check
  useEffect(() => {
    const doSetup = async function(): Promise<void> {
      if (!(await checkConnected())) {
        console.log("Checking whitelist")
        try {
          const result = await authService.checkWhiteList()
          console.log(`Returned ${result}`)
          if (Boolean(result)) {
            console.log("Verified whitelist")
            setWhitelisted(true)
            setError(null)
            await checkConnected()
          } else {
            console.log("Not whitelisted")
            setWhitelisted(false)
            setError(null)
          }
        } catch (error) {
          console.log("Error checking whitelist")
          setWhitelisted(false)
          setError(error.message)
        }
      }
    }
    doSetup().finally(() => setLoading(false))
  }, [checkConnected])

  if (loading) {
    return (
      <Dimmer active={true}>
        <Loader active={true} />
      </Dimmer>
    )
  } else if (!whitelisted) {
    return <Whitelisting onApply={onWhitelist} error={error} />
  } else if (!loggedIn) {
    return <Login error={error} onLogin={onLogin} />
  } else {
    return (
      <AuthContext.Provider value={api}>{props.children}</AuthContext.Provider>
    )
  }
}

export default Authorizer
export * from "./withAuth"
export * from "./AuthContext"

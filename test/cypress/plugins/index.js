// ***********************************************************
// This file is used to load plugins.
//
// You can read more about Cypress plugins here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

'use strict'

// NPM dependencies
const lodash = require('lodash')
const request = require('request-promise-native')

// Local dependencies
const cookieMonster = require('./cookie-monster')
const stubs = require('./stubs')

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
module.exports = (on, config) => {
  const mountebankImpostersUrl = config.env.MOUNTEBANK_URL + '/imposters'

  on('task', {
    getCookies (opts) {
      const encryptedSessionCookie = generateEncryptedSessionCookie(
        config.env.TEST_SESSION_ENCRYPTION_KEY,
        opts.user_external_id,
        opts.pageData
      )
      const encryptedGatewayAccountCookie = generateEncryptedGatewayAccountCookie(
        config.env.TEST_SESSION_ENCRYPTION_KEY,
        opts.gateway_account_id
      )

      return { encryptedSessionCookie, encryptedGatewayAccountCookie }
    },
    /**
     * Makes a post request to Mountebank to setup an Imposter with stubs built using the array of stub specifications
     * provided.
     *
     * Note: this task can only be called once per test, so all stubs for a test must be set up in the same call.
     *
     * @param stubSpecs - an array of stub specification objects, each having a `name` and `opts`. The name refers to
     * the name of a function defined in plugins/stubs.js, and the opts is an object passed to this function providing
     * the configuration options for building the stub predicates and responses.
     */
    setupStubs (stubSpecs) {
      const stubsArray = lodash.flatMap(stubSpecs, spec => stubs[spec.name](spec.opts))
      return request({
        method: 'POST',
        url: mountebankImpostersUrl,
        json: true,
        body: {
          port: config.env.MOUNTEBANK_IMPOSTERS_PORT,
          protocol: 'http',
          stubs: stubsArray
        }
      })
    },
    /**
     * Makes a request to Mountebank to delete the existing Imposter along with all stubs that have been set up.
     */
    clearStubs () {
      return request.delete(mountebankImpostersUrl)
    },
    /**
     * Makes a request to Mountebank to verify that stubs have been called the expected number of times
     */
    verifyStubs () {
      return request({
        method: 'GET',
        url: `${mountebankImpostersUrl}/${config.env.MOUNTEBANK_IMPOSTERS_PORT}`,
        json: true
      }).then(response => {
        response.stubs.forEach((stub) => {
          // NOTE: if the "verifyCalledTimes" is specified for a stub, we will attempt to verify
          // for all `it` blocks the stub is setup for, and the counter is reset for every `it`.
          if (stub.verifyCalledTimes) {
            // the matches array is added to stubs only when Mountebank is run with the --debug flag
            const timesCalled = (stub.matches && stub.matches.length) || 0
            if (timesCalled !== stub.verifyCalledTimes) {
              throw new Error(`Expected stub '${stub.name}' to be called ${stub.verifyCalledTimes} times, but was called ${timesCalled} times`)
            }
          }
        })

        return null
      })
        .catch(err => {
          if (err.statusCode === 404) {
            // imposter probably hasn't been added in Mountebank as no stubs were setup for the current
            // test
            return null
          }
          throw err
        })
    }
  })

  // send back the modified config object
  return config
}

function generateEncryptedSessionCookie (sessionEncyptionKey, userExternalId, pageData = {}) {
  const encryptedSessionCookie = cookieMonster.getCookie('session', sessionEncyptionKey,
    {
      passport: { user: userExternalId },
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'cypress.io',
      pageData
    })
  return encryptedSessionCookie
}

function generateEncryptedGatewayAccountCookie (sessionEncyptionKey, gatewayAccountId) {
  const encryptedGatewayAccountCookie = cookieMonster.getCookie('gateway_account', sessionEncyptionKey,
    {
      currentGatewayAccountId: gatewayAccountId,
      icamefrom: 'cypress.io'
    })
  return encryptedGatewayAccountCookie
}

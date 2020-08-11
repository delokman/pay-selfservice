'use strict'

const commonStubs = require('../../utils/common-stubs')
const userStubs = require('../../utils/user-stubs')
const gatewayAccountStubs = require('../../utils/gateway-account-stubs')

const {
  stubGetGatewayAccountStripeSetupSuccess,
  stubStripeAccountGet,
  stubStripeSetupGetForMultipleCallsAndVatNumberCompleted,
  stubDashboardStatisticsGet
} = require('./support-stubs')

describe('Stripe setup: VAT number page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'

  describe('Card gateway account', () => {
    describe('when user is admin, account is Stripe and "VAT number" is not already submitted', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' }),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, { 'vatNumberCompleted': false }),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123'),
          commonStubs.getGatewayAccountStripeSetupSuccess(gatewayAccountId, true, true, true, true)
        ])

        cy.setEncryptedCookies(userExternalId, gatewayAccountId, {})

        cy.visit('/vat-number')
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'What is your organisation’s VAT number?')

        cy.get('#vat-number-form').should('exist')
          .within(() => {
            cy.get('input#vat-number[name="vat-number"]').should('exist')
            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Save and continue')
          })
      })

      it('should display an error when VAT number input is blank', () => {
        cy.get('#vat-number-form > button').click()

        cy.get('h2').should('contain', 'There is a problem')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Enter a valid VAT number, including ‘GB’ at the start')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#vat-number')

        cy.get('.govuk-form-group--error > input#vat-number').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('span.govuk-error-message').should('contain', 'This field cannot be blank')
        })
      })

      it('should display an error when VAT number is invalid', () => {
        cy.get('input#vat-number[name="vat-number"]').type('(╯°□°)╯︵ ┻━┻')

        cy.get('#vat-number-form > button').click()

        cy.get('h2').should('contain', 'There is a problem')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Enter a valid VAT number, including ‘GB’ at the start')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#vat-number')

        cy.get('.govuk-form-group--error > input#vat-number').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('span.govuk-error-message').should('contain', 'Enter a valid VAT number, including ‘GB’ at the start')
        })
      })
    })

    describe('when user is admin, account is Stripe and "VAT number" is already submitted', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should redirect to Dashboard with an error message when displaying the page', () => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' }),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, { 'vatNumberCompleted': true }),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123'),
          stubDashboardStatisticsGet(),
          commonStubs.getGatewayAccountStripeSetupSuccess(gatewayAccountId, true, true, true, true)
        ])

        cy.visit('/vat-number')

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq('/')
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your VAT number.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update it.')
      })

      it('should redirect to Dashboard with an error message when submitting the form', () => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' }),
          stubStripeSetupGetForMultipleCallsAndVatNumberCompleted(gatewayAccountId, false, true),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123'),
          stubDashboardStatisticsGet()
        ])

        cy.visit('/vat-number')

        cy.get('input#vat-number[name="vat-number"]').type('GB999 9999 73')

        cy.get('#vat-number-form > button').click()

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq('/')
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your VAT number.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update it.')
      })
    })

    describe('when it is not a Stripe gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should show a 404 error when gateway account is not Stripe', () => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'sandbox' }),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, { 'vatNumberCompleted': false }),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
        ])

        cy.visit('/vat-number', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when it is not a live gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should show a 404 error when gateway account is not live', () => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'test', paymentProvider: 'stripe' }),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, { 'vatNumberCompleted': false }),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
        ])

        cy.visit('/vat-number', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when the user does not have the correct permissions', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' }),
          commonStubs.getGatewayAccountStripeSetupSuccess(gatewayAccountId, true, true, true, true)
        ])

        cy.visit('/vat-number', { failOnStatusCode: false })
        cy.get('h1').should('contain', 'An error occurred:')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })

  describe('Direct Debit gateway account', () => {
    const directDebitGatewayAccountId = 'DIRECT_DEBIT:101'

    it('should show an error page', () => {
      cy.setEncryptedCookies(userExternalId, directDebitGatewayAccountId)

      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId: directDebitGatewayAccountId }),
        gatewayAccountStubs.getDirectDebitGatewayAccountSuccess({ gatewayAccountId: directDebitGatewayAccountId, type: 'live', paymentProvider: 'gocardless' })
      ])

      cy.visit('/vat-number', {
        failOnStatusCode: false
      })

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'This page is only available to card accounts not direct debit accounts.')
    })
  })
})
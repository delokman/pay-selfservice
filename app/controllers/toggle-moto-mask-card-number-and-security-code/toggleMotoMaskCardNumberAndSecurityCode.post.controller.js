'use strict'

// Local dependencies
const paths = require('../../paths')
const { renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { correlationHeader } = require('../../utils/correlation-header')

module.exports = async (req, res) => {
  const connector = new ConnectorClient(process.env.CONNECTOR_URL)
  const correlationId = req.headers[correlationHeader] || ''
  const accountId = req.account.gateway_account_id

  const enableMaskCardNumber = req.body['moto-mask-card-number-input-toggle'] === 'on'
  const enableMaskSecurityCode = req.body['moto-mask-security-code-input-toggle'] === 'on'

  try {
    await Promise.all([
      connector.toggleMotoMaskCardNumberInput(accountId, enableMaskCardNumber, correlationId), 
      connector.toggleMotoMaskSecurityCodeInput(accountId, enableMaskSecurityCode, correlationId), 
    ]);

    req.flash('generic', 'Your changes have saved')
    return res.redirect(paths.toggleMotoMaskCardNumberAndSecurityCode.index)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}

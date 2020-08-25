'use strict'

const { response, renderErrorView } = require('../../utils/response')

module.exports = async (req, res) => {
  try {
    const pageData = {
      allowMoto: req.account.allow_moto,
      motoMaskCardNumberInputEnabled: req.account.moto_mask_card_number_input,
      motoMaskCardSecurityCodeInputEnabled: req.account.moto_mask_card_security_code_input
    }

    return response(req, res, 'toggle-moto-mask-card-number-and-security-code/index', pageData)
  } catch (error) {
    return renderErrorView(req, res, false, error.errorCode)
  }
}

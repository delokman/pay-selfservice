'use strict'

// NPM dependencies
const { expect } = require('chai')

// Local dependencies
const organisationVatValidations = require('./vat-number-validations')

// Constants
const BLANK_TEXT = ''
const INVALID_TEXT = 'BADD000'
const LOOOONG_TEXT = 'GB999 9999 7333333333333'
const standardVatNumber = 'GB999 9999 73'
const governmentDepartmentsVatNumber = 'GBGD001'
const branchTradersVatNumber = 'GB123456789123'
const healthAuthoritiesVatNumber = 'GBHA599'

describe('VAT number validations', () => {
  describe('UK VAT number field validations', () => {
    it('should validate that Standard VAT numbers are valid', () => {
        expect(organisationVatValidations.validateMandatoryField(standardVatNumber).valid).to.be.true // eslint-disable-line
    })

    it('should validate that Government Department VAT numbers are valid', () => {
        expect(organisationVatValidations.validateMandatoryField(governmentDepartmentsVatNumber).valid).to.be.true // eslint-disable-line
    })

    it('should validate that Branch Trader VAT numbers are valid', () => {
        expect(organisationVatValidations.validateMandatoryField(branchTradersVatNumber).valid).to.be.true // eslint-disable-line
    })

    it('should validate that Health Authority VAT numbers are valid', () => {
        expect(organisationVatValidations.validateMandatoryField(healthAuthoritiesVatNumber).valid).to.be.true // eslint-disable-line
    })
  })

  it('should not be valid when mandatory text is blank', () => {
    expect(organisationVatValidations.validateMandatoryField(BLANK_TEXT)).to.deep.equal({
      valid: false,
      message: 'This field cannot be blank'
    })
  })

  it('should not be valid when mandatory text is too long', () => {
    expect(organisationVatValidations.validateMandatoryField(LOOOONG_TEXT)).to.deep.equal({
      valid: false,
      message: 'Enter a valid VAT number'
    })
  })

  it('should not be valid when mandatory text is invalid VAT number', () => {
    expect(organisationVatValidations.validateMandatoryField(INVALID_TEXT)).to.deep.equal({
      valid: false,
      message: 'Enter a valid VAT number'
    })
  })
})

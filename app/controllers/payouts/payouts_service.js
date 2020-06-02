const moment = require('moment')

const Ledger = require('../../../app/services/clients/ledger_client')
const Paginator = require('../../utils/paginator')

const { indexServiceNamesByGatewayAccountId } = require('./user_services_names')

const PAGE_SIZE = 20
const MAX_PAGES = 2

const getPayoutDate = function getPayoutDate (payout) {
  return payout.paid_out_date || payout.created_date
}

const sortPayoutByDateString = function sortPayoutByDateString (a, b) {
  return new Date(getPayoutDate(b)) - new Date(getPayoutDate(a))
}

const groupPayoutsByDate = function groupPayoutsByDate (payouts, user) {
  const serviceNameMap = indexServiceNamesByGatewayAccountId(user)
  const groups = {}

  payouts.sort(sortPayoutByDateString)
  payouts.forEach((payout) => {
    const date = moment(getPayoutDate(payout))
    const key = date.format('YYYY-MM-DD')
    payout.serviceName = serviceNameMap[payout.gateway_account_id] || '(No service name)'

    groups[key] = groups[key] || { date, entries: [] }
    groups[key].entries.push(payout)
  })

  return groups
}

const formatPayoutPages = function formatPayoutPages (payoutSearchResponse) {
  const { total, page } = payoutSearchResponse
  const paginator = new Paginator(total, PAGE_SIZE, page)
  const hasMultiplePages = paginator.getLast() > 1
  const links = hasMultiplePages && paginator.getNamedCentredRange(MAX_PAGES, true, true)
  return { total, page, links }
}

const payouts = async function payouts (gatewayAccountId, user = {}, page = 1) {
  const payoutSearchResponse = await Ledger.payouts(gatewayAccountId, page, PAGE_SIZE)
  return {
    groups: groupPayoutsByDate(payoutSearchResponse.results, user),
    pages: formatPayoutPages(payoutSearchResponse)
  }
}

module.exports = {
  payouts,
  groupPayoutsByDate
}
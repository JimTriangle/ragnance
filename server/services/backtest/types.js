/**
 * @typedef {Object} Candle
 * @property {number} t
 * @property {number} o
 * @property {number} h
 * @property {number} l
 * @property {number} c
 * @property {number} v
 */

/**
 * @typedef {'BUY'|'SELL'} OrderSide
 */

/**
 * @typedef {'MARKET'|'LIMIT'} OrderType
 */

/**
 * @typedef {Object} Trade
 * @property {string} id
 * @property {number} t
 * @property {OrderSide} side
 * @property {number} qty
 * @property {number} price
 * @property {number} fee
 * @property {string} [note]
 */

/**
 * @typedef {Object} EquityPoint
 * @property {number} t
 * @property {number} equity
 * @property {number} drawdown
 */

/**
 * @typedef {Object} BacktestParams
 * @property {'KRAKEN'} exchange
 * @property {string} pair
 * @property {number} timeframe
 * @property {number} from
 * @property {number} to
 * @property {'smaCross'|'rsiRevert'} strategy
 * @property {number} feePct
 * @property {number} slippagePct
 * @property {number} initialCash
 */

/**
 * @typedef {Object} BacktestResult
 * @property {string} id
 * @property {BacktestParams} params
 * @property {Object} kpis
 * @property {Trade[]} trades
 * @property {EquityPoint[]} equity
 * @property {number} createdAt
 */

module.exports = {};
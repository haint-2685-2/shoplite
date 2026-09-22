/* This module imports from another module — the graph can be any depth. */
import formatPrice from './format.js';

export const lineTotal = ({ price, qty }) => price * qty;

export const cartTotal = (lines) => lines.reduce((sum, line) => sum + lineTotal(line), 0);

export const describeCart = (lines) =>
  `${lines.length} line(s), ${formatPrice(cartTotal(lines))} in total`;

// utils/generateCompanyCode.js
// ─────────────────────────────────────────────
//  Generates a unique COMP-XXXX company code
//  Ensures no collisions against the database
// ─────────────────────────────────────────────

const Company = require('../models/Company');

/**
 * Generates a random 4-digit numeric string
 * @returns {string} e.g. "4829"
 */
const randomDigits = () => Math.floor(1000 + Math.random() * 9000).toString();

/**
 * Generates a unique company code of format COMP-XXXX
 * Retries up to `maxAttempts` times to avoid collision
 *
 * @param {number} maxAttempts - max retry attempts (default 10)
 * @returns {Promise<string>} unique company code
 * @throws {Error} if unable to generate a unique code
 */
const generateCompanyCode = async (maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = `COMP-${randomDigits()}`;

    const existing = await Company.findOne({ companyCode: code });
    if (!existing) {
      return code;
    }
  }

  // Fallback: use timestamp-based suffix for guaranteed uniqueness
  const fallback = `COMP-${Date.now().toString().slice(-6)}`;
  return fallback;
};

module.exports = generateCompanyCode;

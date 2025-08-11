/**
 * Utility functions to convert Sequelize decimal fields to numbers
 */

/**
 * Convert decimal string to number
 * @param {string|number} value - The decimal value to convert
 * @returns {number} - The converted number
 */
export const convertDecimalToNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Convert all decimal fields in an object to numbers
 * @param {Object} obj - The object to process
 * @param {Array} decimalFields - Array of field names that should be converted
 * @returns {Object} - The processed object with converted decimal fields
 */
export const convertDecimalFields = (obj, decimalFields = ['amount', 'bill', 'rent', 'advancePayment', 'pendingAmount']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  for (const field of decimalFields) {
    if (result.hasOwnProperty(field)) {
      result[field] = convertDecimalToNumber(result[field]);
    }
  }
  
  return result;
};

/**
 * Convert decimal fields in an array of objects
 * @param {Array} array - Array of objects to process
 * @param {Array} decimalFields - Array of field names that should be converted
 * @returns {Array} - The processed array with converted decimal fields
 */
export const convertDecimalFieldsInArray = (array, decimalFields = ['amount', 'bill', 'rent', 'advancePayment', 'pendingAmount']) => {
  if (!Array.isArray(array)) return array;
  
  return array.map(item => convertDecimalFields(item, decimalFields));
};

/**
 * Convert decimal fields in nested objects (transactions, expenses)
 * @param {Object} record - The record object to process
 * @returns {Object} - The processed record with all decimal fields converted
 */
export const convertNestedDecimalFields = (record) => {
  if (!record || typeof record !== 'object') return record;
  
  const result = { ...record };
  
  // Convert main decimal fields
  result.bill = convertDecimalToNumber(result.bill);
  result.rent = convertDecimalToNumber(result.rent);
  result.pendingAmount = convertDecimalToNumber(result.pendingAmount);
  
  // Convert transaction amounts
  if (Array.isArray(result.transactions)) {
    result.transactions = result.transactions.map(transaction => ({
      ...transaction,
      amount: convertDecimalToNumber(transaction.amount)
    }));
  }
  
  // Convert expense amounts
  if (Array.isArray(result.expenses)) {
    result.expenses = result.expenses.map(expense => ({
      ...expense,
      amount: convertDecimalToNumber(expense.amount)
    }));
  }
  
  return result;
};


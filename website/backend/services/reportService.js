const admin = require('firebase-admin');
const { Parser } = require('json2csv');

/**
 * Aggregate data for reports from various collections
 * @param {string} collectionName 
 * @param {Object} filters 
 */
const getReportData = async (collectionName, filters = {}) => {
  const db = admin.firestore();
  let query = db.collection(collectionName);

  // Simple date filtering logic
  if (filters.startDate) {
    query = query.where('timestamp', '>=', new Date(filters.startDate));
  }
  if (filters.endDate) {
    query = query.where('timestamp', '<=', new Date(filters.endDate));
  }
  if (filters.city) {
    query = query.where('location', '==', filters.city);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Convert JSON data to CSV string
 * @param {Array} data 
 * @param {Array} fields 
 */
const convertToCSV = (data, fields) => {
  const parser = new Parser({ fields });
  return parser.parse(data);
};

module.exports = { getReportData, convertToCSV };

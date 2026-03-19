const { getReportData, convertToCSV } = require('../services/reportService');
const { logEvent } = require('../services/auditService');

exports.downloadReport = async (req, res) => {
  const { collection, format } = req.params;
  const filters = req.query;
  const adminId = req.user.uid;

  try {
    const data = await getReportData(collection, filters);
    
    // Log the report download
    await logEvent(adminId, 'REPORT_DOWNLOAD', collection, { format, filters });

    if (format === 'csv') {
      let fields = [];
      if (collection === 'users') fields = ['id', 'name', 'email', 'status', 'location', 'platform'];
      else if (collection === 'payouts') fields = ['id', 'userId', 'amount', 'status', 'timestamp'];
      else if (collection === 'fraud_alerts') fields = ['id', 'type', 'riskScore', 'status', 'timestamp'];
      else fields = Object.keys(data[0] || {});

      const csv = convertToCSV(data, fields);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${collection}_report_${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'json') {
      return res.json(data);
    }

    res.status(400).json({ error: 'Unsupported format. Use csv or json.' });
  } catch (error) {
    console.error('Report Download Error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

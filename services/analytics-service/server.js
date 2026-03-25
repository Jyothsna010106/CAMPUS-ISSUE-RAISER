const express = require('express');
const cors = require('cors');
const { auth } = require('../common/auth');
const { requestJson } = require('../common/http');

// Set service-specific MongoDB database for data isolation
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = process.env.ANALYTICS_SERVICE_MONGO_URI || 'mongodb+srv://poojarylishmith_db_user:bZit-iYxnS6NSq5@cluster0.csdcgtv.mongodb.net/analytics_service_db';
}

const app = express();
app.use(cors());
app.use(express.json());

const ISSUE_SERVICE_URL = process.env.ISSUE_SERVICE_URL || 'http://localhost:5003';
const SECTION_SERVICE_URL = process.env.SECTION_SERVICE_URL || 'http://localhost:5002';

app.get('/analytics/weekly', auth, async (req, res) => {
  try {
    const authHeader = { Authorization: req.headers.authorization || '' };
    const [issues, sections] = await Promise.all([
      requestJson(ISSUE_SERVICE_URL, '/issues', { headers: authHeader }),
      requestJson(SECTION_SERVICE_URL, '/sections'),
    ]);

    const sectionMap = sections.reduce((acc, item) => {
      acc[item._id] = item.name;
      return acc;
    }, {});

    const issuesPerSection = issues.reduce((acc, issue) => {
      const key = sectionMap[issue.sectionId] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const resolved = issues.filter((item) => item.status === 'Resolved').length;
    const pending = issues.length - resolved;

    const deptMap = issues.reduce((acc, issue) => {
      const key = issue.createdByDepartment || 'General';
      if (!acc[key]) {
        acc[key] = { complaints: 0, resolved: 0, pending: 0 };
      }

      acc[key].complaints += 1;
      if (issue.status === 'Resolved') {
        acc[key].resolved += 1;
      } else {
        acc[key].pending += 1;
      }

      return acc;
    }, {});

    const departmentPerformance = Object.entries(deptMap)
      .map(([department, values]) => {
        const resolutionRate = values.complaints > 0 ? Math.round((values.resolved / values.complaints) * 100) : 0;
        const score = values.resolved * 3 - values.pending * 2;

        let rating = 'Average';
        if (resolutionRate >= 70) {
          rating = 'Good';
        } else if (resolutionRate <= 35) {
          rating = 'Needs Attention';
        }

        return {
          department,
          complaints: values.complaints,
          resolved: values.resolved,
          pending: values.pending,
          resolutionRate,
          score,
          rating,
        };
      })
      .sort((a, b) => b.score - a.score);

    const topDepartment = departmentPerformance[0] || null;
    const lowestDepartment = departmentPerformance[departmentPerformance.length - 1] || null;

    return res.json({
      totalIssues: issues.length,
      resolved,
      pending,
      issuesPerSection,
      departmentPerformance,
      topDepartment,
      lowestDepartment,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(error.status || 500).json(error.body || { error: 'Unable to load analytics summary' });
  }
});

app.get('/health', (req, res) => {
  return res.json({ success: true, service: 'analytics-service' });
});

const PORT = Number(process.env.ANALYTICS_SERVICE_PORT || 5008);
app.listen(PORT, () => {
  console.log(`Analytics Service running on http://localhost:${PORT}`);
});

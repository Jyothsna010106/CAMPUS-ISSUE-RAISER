const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:5001',
  section: process.env.SECTION_SERVICE_URL || 'http://localhost:5002',
  issue: process.env.ISSUE_SERVICE_URL || 'http://localhost:5003',
  interaction: process.env.INTERACTION_SERVICE_URL || 'http://localhost:5004',
  evidence: process.env.EVIDENCE_SERVICE_URL || 'http://localhost:5005',
  escalation: process.env.ESCALATION_SERVICE_URL || 'http://localhost:5006',
  status: process.env.STATUS_SERVICE_URL || 'http://localhost:5007',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5008',
};

const HEALTH_TIMEOUT_MS = Number(process.env.HEALTH_TIMEOUT_MS || 2500);

const probeServiceHealth = async (name, baseUrl) => {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();

    return {
      service: name,
      url: baseUrl,
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      details: body,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      service: name,
      url: baseUrl,
      ok: false,
      status: 0,
      latencyMs: Date.now() - startedAt,
      error: error.name === 'AbortError' ? 'timeout' : error.message,
    };
  }
};

const collectServicesHealth = async () => {
  const checks = await Promise.all(
    Object.entries(services).map(([name, url]) => probeServiceHealth(name, url))
  );

  const healthy = checks.filter((check) => check.ok).length;
  return {
    overall: healthy === checks.length ? 'healthy' : 'degraded',
    healthy,
    total: checks.length,
    checks,
  };
};

const proxy = async (req, res, targetBase, path) => {
  try {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const response = await fetch(`${targetBase}${path}${query}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || '',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();
    return res.status(response.status).send(payload);
  } catch (error) {
    return res.status(502).json({ error: 'Service unavailable', details: error.message });
  }
};

app.use('/api/auth', (req, res) => proxy(req, res, services.user, req.originalUrl.replace('/api', '')));
app.use('/api/users', (req, res) => proxy(req, res, services.user, req.originalUrl.replace('/api', '')));
app.use('/api/sections', (req, res) => proxy(req, res, services.section, req.originalUrl.replace('/api', '')));
app.use('/api/interactions', (req, res) => proxy(req, res, services.interaction, req.originalUrl.replace('/api', '')));
app.use('/api/evidence', (req, res) => proxy(req, res, services.evidence, req.originalUrl.replace('/api', '')));
app.use('/api/analytics', (req, res) => proxy(req, res, services.analytics, req.originalUrl.replace('/api', '')));

app.use('/api/issues/:id/status', (req, res) => {
  const path = `/issues/${req.params.id}/status`;
  return proxy(req, res, services.status, path);
});

app.use('/api/issues/:id/escalate', (req, res) => {
  const path = `/issues/${req.params.id}/escalate`;
  return proxy(req, res, services.escalation, path);
});

app.use('/api/issues', (req, res) => proxy(req, res, services.issue, req.originalUrl.replace('/api', '')));

app.get('/health', async (req, res) => {
  const downstream = await collectServicesHealth();
  const statusCode = downstream.overall === 'healthy' ? 200 : 503;

  return res.status(statusCode).json({
    success: downstream.overall === 'healthy',
    service: 'gateway',
    downstream,
  });
});

app.get('/health/services', async (req, res) => {
  const downstream = await collectServicesHealth();
  const statusCode = downstream.overall === 'healthy' ? 200 : 503;

  return res.status(statusCode).json(downstream);
});

const PORT = Number(process.env.GATEWAY_PORT || 5000);
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});

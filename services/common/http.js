const requestJson = async (serviceBaseUrl, path, options = {}) => {
  const response = await fetch(`${serviceBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error('Request failed');
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
};

module.exports = {
  requestJson,
};

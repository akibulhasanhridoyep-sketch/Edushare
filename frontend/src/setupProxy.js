const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Only use proxy in development when API_BASE_URL is not set
  if (!process.env.REACT_APP_API_BASE_URL) {
    app.use('/api', createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    }));

    app.use('/uploads', createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    }));
  }
  // In production, REACT_APP_API_BASE_URL env var is used from api.js
};

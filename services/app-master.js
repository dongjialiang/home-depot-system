// app-master.js
const pm2 = require('pm2');
const { RateLimiterClusterMasterPM2 } = require('rate-limiter-flexible');
const { consumeMessage } = require('./emailWorker');

consumeMessage();
new RateLimiterClusterMasterPM2(pm2);

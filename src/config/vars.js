const path = require('path');

// import .env variables
require('dotenv-safe').config({
    path: path.join(__dirname, '../../.env'),
    example: path.join(__dirname, '../../.env.example'),
});

module.exports = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    stackKey: process.env.STACK_KEY,
    errorBotServer: process.env.ERROR_BOT_SERVER,
    service: process.env.SERVICE,
    origin: process.env.ORIGIN,
    logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
};

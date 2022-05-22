const express = require('express');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const v1 = require('./routes/v1');
const routes = require('./routes');
const morgan = require('morgan');
const { logs, port, origin } = require('./config/vars');
const { handleError } = require("./utils/handleError");
const { ValidationError } = require("express-validation");

/**
 * Express instance
 * @public
 */
const app = express();

// request logging. dev: console | production: file
app.use(morgan(logs));

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// gzip compression
app.use(compress());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors({
    origin,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
}));

// mount api v1 routes
app.use('/v1', v1);
app.use('/', routes);

app.use(async function (err, req, res, next) {
    if (err instanceof ValidationError) {
        await handleError(err, 'Validation')

        return res.status(err.statusCode).json(err)
    }

    if (err) {
        await handleError(err.details.body, 'Validation')
        return res.status(500).json(err)
    }

    return next();
})

app.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

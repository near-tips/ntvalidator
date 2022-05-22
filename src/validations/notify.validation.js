const { Joi } = require("express-validation");

module.exports = {
    // POST /v1/notify
    sign: {
        body: Joi.object({
            accessToken: Joi.string().required(),
            userId: Joi.string().required(),
            accountId: Joi.string().required(),
        }),
    },
};

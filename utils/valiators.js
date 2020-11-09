const Joi = require("joi");

module.exports = {

    validateCreateUser: (body) => {

        const schema = Joi.object({
            username: Joi.string()
                .alphanum()
                .min(5)
                .max(30)
                .required(),

            password: Joi.string().required().min(5).max(200),

            password2: Joi.ref("password"),

            email: Joi.string().email().required(),
            firstname: Joi.string().required(),
            lastname: Joi.string().required(),
            role: Joi.string().required(),
        });

        return schema.validate(body)

    },

    validateResetPasswd: (body) => {
        const schema = Joi.object({
            password: Joi.string().required().min(5).max(200),
            password2: Joi.ref("password"),

        });

        return schema.validate(body)


    },


    validateChangePasswd: (body) => {

        const schema = Joi.object({

            oldpassword: Joi.string().required().min(5).max(200),
            password: Joi.string().required().min(5).max(200),
            password2: Joi.ref("password"),

        });

        return schema.validate(body);
    },

    validateDataTransfer: (body) => {

        const schema = Joi.object({
            to_msisdn: Joi.string()
                .alphanum()
                .length(12)
                .regex(/^233255.+/)
                .required(),

            from_msisdn: Joi.string()
                .alphanum()
                .length(12)
                .regex(/^233255.+/)
                .required(),

            amount: Joi.number()
                .min(0.1)
                .max(100)
                .required(),
            from_bundle: Joi.string()
                .min(3)
                .required(),

            to_bundle: Joi.string()
                .min(3)
                .required(),

        });

        return schema.validate(body)

    },

    validateEmail : (body) =>{
        const schema = Joi.object({

            email: Joi.string()
                .email()
                .regex(/.*surflinegh.com/i)
                .required(),

        });

        return schema.validate(body);
    }


}


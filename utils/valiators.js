const Joi = require("joi");

module.exports = {

    validateCreateUser : (body) =>{

        const schema = Joi.object({
            username: Joi.string()
                .alphanum()
                .min(3)
                .max(30)
                .required(),

            password:Joi.string().required().min(3).max(200),

            password2:Joi.ref("password"),

            email:Joi.string().email().required(),
            firstname:Joi.string().required(),
            lastname:Joi.string().required(),
            role:Joi.string().required(),
        });

        return schema.validate(body)

    }


}


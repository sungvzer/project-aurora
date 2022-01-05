import { SingleResourceResponse } from '../../utils/jsonAPI';
import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { ENVIRONMENT } from '../../utils/secrets';
import { body, check, Result, ValidationError, validationResult } from 'express-validator';
import {
    resourceObjectHas,
    resourceObjectSanitizeEmail,
    resourceObjectValidateEmail,
} from '../../utils/customValidators';
import * as err from '../../utils/errors';
import htmlPasswordResetTemplate from '../../templates/email';
import User from '../../models/User';
import PasswordResetKey from '../../models/PasswordResetKey';

let smtpOptions: SMTPTransport.Options;

if (ENVIRONMENT === 'Development') {
    smtpOptions = {
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            // We really don't care for clear-text passwords as they are a temporary account that does not communicate with the outer world
            user: 'missouri.bruen80@ethereal.email',
            pass: 'x4TyU7XDJABczr84PP',
        },
    };
} else {
    smtpOptions = {
        url: process.env.SMTP_SERVER,
        port: parseInt(process.env.SMTP_PORT),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    };
}

export const { requestPasswordReset } = new (class {
    transport = nodemailer.createTransport(smtpOptions);
    requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
        const response = new SingleResourceResponse('data');

        /**
         * Empty Checks
         */
        await check('data', err.blankEmail).custom(resourceObjectHas('email')).run(req);
        /**
         * Validity Checks
         */
        await check('data', err.invalidEmail).custom(resourceObjectValidateEmail).run(req);

        /**
         * Body sanitization
         */
        await body('data').customSanitizer(resourceObjectSanitizeEmail).run(req);

        /**
         * Error handling
         */
        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            for (const { msg: error } of errors.array()) {
                response.addError(error);
            }
            res.status(400).json(response.close());
            return;
        }

        const email = req.body.data.attributes.email;
        {
            const idOrError = await User.getUserIdByEmail(email);
            if (idOrError.isError()) {
                response.meta = {
                    message:
                        'A reset key has been sent to the email as requested. Use this key in the /reset_password endpoint.',
                };
                res.status(201).json(response.close());
                return;
            }
        }

        const resetKeyOrError = await PasswordResetKey.produce(email);
        if (resetKeyOrError.isError()) {
            response.addError(err.internal);
            res.status(500).json(response.close());
        }

        const resetKey = resetKeyOrError.value;
        const passwordResetEmail: SMTPTransport.Options = {};
        Object.assign(passwordResetEmail, smtpOptions);
        passwordResetEmail.to = email;
        passwordResetEmail.html = htmlPasswordResetTemplate.replace('{{params.key}}', resetKey.key);
        passwordResetEmail.subject = 'Password reset';
        this.transport.sendMail(passwordResetEmail);
        response.meta = {
            message:
                'A reset key has been sent to the email as requested. Use this key in the /reset_password endpoint.',
        };
        res.status(201).json(response.close());
    };
})();

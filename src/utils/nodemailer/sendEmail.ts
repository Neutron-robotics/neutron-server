import Mail from 'nodemailer/lib/mailer';
import transporter from '.';
import logger from '../../logger';
import templateDictionnary from './templates';
import { replaceAll } from '../string';

interface EmailSendOption {
    subject: string,
    to: string
    fromAddress?: string
    fromName?: string
    template: string
    templateArgs?: Record<string, string>
}

const sendEmail = async (options: EmailSendOption) => {
  let template = templateDictionnary[options.template];
  if (!template) {
    logger.error(`Can't find email template ${options.template}, aborting send email`);
    return;
  }

  if (options.templateArgs) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(options.templateArgs)) {
      template = replaceAll(template, key, value);
    }
  }

  const mailOptions: Mail.Options = {
    from: {
      name: options.fromName ?? 'Neutron Team',
      address: options.fromAddress ?? 'noreply@neutron-robotics.com'
    },
    to: options.to,
    subject: options.subject,
    html: template
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err: any) {
    logger.error(`Error when sending email ${err.message}`);
  }
};

export default sendEmail;

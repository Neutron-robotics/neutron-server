import registerTemplate from './register';
import verifyTemplate from './verify';
import contactFormTemplate from './contactForm';

const templateDictionnary: Record<string, string> = {
  verify: verifyTemplate,
  register: registerTemplate,
  contactForm: contactFormTemplate
};

export default templateDictionnary;

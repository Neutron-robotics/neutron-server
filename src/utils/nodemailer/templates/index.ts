import registerTemplate from './register';
import verifyTemplate from './verify';

const templateDictionnary: Record<string, string> = {
  verify: verifyTemplate,
  register: registerTemplate
};

export default templateDictionnary;

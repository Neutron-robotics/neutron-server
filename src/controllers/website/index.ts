import { Router } from 'express';
import subscribeNewsletter from './newsletter';
import subscribeForm from './subscribeForm';

const useWebsiteController = (router: Router) => {
  router.post('/contact/newsletter', subscribeNewsletter);
  router.post('/contact/subscribeForm', subscribeForm);
};

export default useWebsiteController;

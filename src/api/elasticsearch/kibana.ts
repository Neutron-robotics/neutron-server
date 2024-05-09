import axios from 'axios';

const kibanaServer = axios.create({
  baseURL: process.env.KIBANA_HOSTNAME,
  auth: {
    username: process.env.NEUTRON_ADMIN_ELK_USERNAME ?? '',
    password: process.env.NEUTRON_ADMIN_ELK_PASSWORD ?? ''
  },
  headers: {
    'kbn-xsrf': 'reporting'
  }
});

export default kibanaServer;

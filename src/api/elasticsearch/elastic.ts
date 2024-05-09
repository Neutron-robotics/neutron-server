import axios from 'axios';

const elasticServer = axios.create({
  baseURL: process.env.ELASTIC_HOSTNAME,
  auth: {
    username: process.env.NEUTRON_ADMIN_ELK_USERNAME ?? '',
    password: process.env.NEUTRON_ADMIN_ELK_PASSWORD ?? ''
  }
});

export default elasticServer;

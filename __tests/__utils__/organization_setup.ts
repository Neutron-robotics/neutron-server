/* eslint-disable import/no-extraneous-dependencies */
import request from 'supertest';
import app from '../../src/app';
import Organization from '../../src/models/Organization';
import { generateRandomString } from './string';

const makeOrganization = async (token: string) => {
  const name = `test organization ${generateRandomString(6)}`;
  await request(app)
    .post('/organization/create')
    .auth(token, { type: 'bearer' })
    .send({
      name,
      company: 'Hugosoft',
      description: 'This should be a long string to be displayed',
      imgUrl: 'https://static.hugosoft.com/neutron/img.png'
    });

  const organization = await Organization.findOne({
    name
  }).exec();
  if (!organization) { throw new Error('The test user failed to be created'); };

  return organization;
};

export { makeOrganization };

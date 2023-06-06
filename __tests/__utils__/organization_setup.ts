/* eslint-disable import/no-extraneous-dependencies */
import request from 'supertest';
import app from '../../src/app';

const makeOrganization = async (token: string) => {
  const res = await request(app)
    .post('/organization/create')
    .auth(token, { type: 'bearer' })
    .send({
      name: 'My organization',
      company: 'Hugosoft',
      description: 'This should be a long string to be displayed',
      imgUrl: 'https://static.hugosoft.com/neutron/img.png'
    });

  const organization = await Organization.findOne({
    company: 'Hugosoft'
  }).exec();
  if (!organization) { throw new Error('The test user failed to be created'); };

  return organization;
};

export { makeOrganization };

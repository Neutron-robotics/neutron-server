import { randomUUID } from 'crypto';
import User, { UserRole } from '../models/User';
import { generateRandomString } from '../utils/random';
import logger from '../logger';

const initServer = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    logger.info('First server initialization, generating admin credentials...');
    const randomPassword = 'changeme';

    const user = new User({
      firstName: 'neutron',
      lastName: 'admin',
      password: randomPassword,
      email: 'admin@neutron.com',
      active: true,
      role: UserRole.Admin
    });

    await user.save();

    console.log(`\n${'#'.repeat(40)}`);
    console.log('### WARNING: First Server Initialization ###');
    console.log('An admin user has been generated for the initial connection.');
    console.log('We strongly advise you to update the password after your first login.\n');
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${randomPassword}\n`);
    console.log('##########################################\n');
  } catch (error) {
    logger.error('Error initializing server:', error);
  }
};

export default initServer;

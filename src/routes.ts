import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

import useAuthentification from './controllers/auth';
import useAdminController from './controllers/admin';
import useOrganization from './controllers/organization';
import useFileController from './controllers/files';
import useUserController from './controllers/user';
import useRobotController from './controllers/robot';
import useRobotPartController from './controllers/robotParts';
import useRos2Controller from './controllers/ros2';
import useNeutronGraph from './controllers/graphnode';
import useConnection from './controllers/connection';

const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }'
};

const router = Router();

const SWAGGER_YAML_FILEPATH = path.join(__dirname, '../openapi.yml');

// Controllers
useAuthentification(router);
useAdminController(router);
useOrganization(router);
useFileController(router);
useUserController(router);
useRobotController(router);
useRobotPartController(router);
useRos2Controller(router);
useNeutronGraph(router);
useConnection(router);

// Dev routes
if (process.env.NODE_ENV === 'development') {
  const swaggerYaml = yaml.load(fs.readFileSync(SWAGGER_YAML_FILEPATH, 'utf8')) as Object;
  router.use('/dev/api-docs', swaggerUi.serve as any);
  router.get('/dev/api-docs', swaggerUi.setup(swaggerYaml, swaggerUiOptions) as any);
}

export default router;

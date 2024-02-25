import { Router } from 'express';
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
import useAgentController from './controllers/agent';

const router = Router();

// Controllers
useAuthentification(router);
useAdminController(router);
useUserController(router);
useOrganization(router);
useFileController(router);
useUserController(router);
useRobotController(router);
useRobotPartController(router);
useRos2Controller(router);
useNeutronGraph(router);
useConnection(router);
useAgentController(router);

export default router;

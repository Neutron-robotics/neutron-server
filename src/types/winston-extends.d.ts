/* eslint-disable vars-on-top */
/* eslint-disable no-use-before-define */
/* eslint-disable no-var */
declare module 'winston-logstash' {
    import winston = require('winston');

    interface IOptions {
      port: number;
      node_name: string;
      host: string;
    }

    interface Static {
      new (opts: IOptions): Instance;
    }

    interface Instance extends winston.TransportInstance {
    }

    module 'winston' {
      interface Transports {
        Logstash: Static;
      }
    }

    var Logstash: Static;
    export = Logstash;
  }

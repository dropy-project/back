import { User } from '@prisma/client';

export function logStartedService(serviceName, servicePort) {
  console.log(`=============================================`);
  console.log(`🚀 ${serviceName} listening on the port ${servicePort}`);
  console.log(`=============================================`);
}

export class Logger {
  private prefix: string;
  private user: User | undefined;

  constructor(prefix: string, user: User | undefined) {
    this.prefix = prefix;
    this.user = user;
  }

  log(...params) {
    if (this.user != undefined) {
      console.log(`[ ${this.prefix} ] - ${this.user.username} :`, params);
    } else {
      console.log(`[ ${this.prefix} ]`, params);
    }
  }

  warn(...params) {
    if (this.user != undefined) {
      console.warn(`[ ${this.prefix} ] - ${this.user.username} :`, params);
    } else {
      console.warn(`[ ${this.prefix} ]`, params);
    }
  }

  error(...params) {
    if (this.user != undefined) {
      console.error(`[ ${this.prefix} ] - ${this.user.username} :`, params);
    } else {
      console.error(`[ ${this.prefix} ]`, params);
    }
  }
}

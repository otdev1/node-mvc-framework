import { env } from 'node:process';

/*use the dev property of the config object to provide the default values for the database connection 
  however, the jest package uses the values of the test property of config as its default to connection
  to the database
*/
if(env.NODE_ENV == undefined)
{
    env.NODE_ENV = 'dev';
}

const config = {
    dev: {
      host: '',
      database: '',
      user: '',
      password: '',
      port: 0
    },
    test: {
      host: '',
      database: '',
      user: '',
      password: '',
      port: 0
    },
    production: {
      host: '',
      database: '',
      user: '',
      password: ''
    }
  };

export default config[process.env.NODE_ENV];

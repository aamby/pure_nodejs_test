/*
* Create and export configuration variables
*/

//Containers for all the environments
const environments = {};

//Staging (default) environment
environments.staging = {
    'httpPort' : 4000,
    'httpsPort' : 4001,
    'envName' : 'staging',
};

//Production environment
environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
};

//Determine which environment will be passed as per command line arg
 const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

 //Check current environment
 const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

 module.exports = environmentToExport;
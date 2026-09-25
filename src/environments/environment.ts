// Development build. `ng build` replaces this file with environment.prod.ts (see angular.json).

export const environment = {
  production: false,
  // Point at a local Flask server (python run.py) or the staging API
  apiUrl: 'http://localhost:5000'
};

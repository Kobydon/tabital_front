import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
  // Components log user, KYC and payment objects for debugging. Never in production.
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

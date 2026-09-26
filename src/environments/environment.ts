// Development build. `ng build` replaces this file with environment.prod.ts (see angular.json).

export const environment = {
  production: false,
  // Point at a local Flask server (python run.py) or the staging API
  apiUrl: 'http://localhost:5000',
  // Legal documents on tabitalpay.com (§10). The privacy page exists but has no text yet.
  legal: {
    terms: 'https://tabitalpay.com/elementor-page-3332/',
    privacy: 'https://tabitalpay.com/privacy-policy/',
    merchantAgreement: 'https://tabitalpay.com/merchant-agreement/',
    buyerProtection: 'https://tabitalpay.com/buyer-protection/',
    contact: 'https://tabitalpay.com/contact/'
  }
};

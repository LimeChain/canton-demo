import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'canton-demo',
  clientId: 'canton-demo-ui',
});

let authPromise: Promise<Keycloak> | undefined;

export async function ensureAuthenticated(): Promise<Keycloak> {
  if (authPromise) {
    return authPromise;
  }

  authPromise = initializeKeycloak();
  return authPromise;
}

async function initializeKeycloak(): Promise<Keycloak> {
  const authenticated = await keycloak.init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });

  if (!authenticated) {
    await keycloak.login();
  }

  return keycloak;
}

export async function getAccessToken(): Promise<string> {
  await ensureAuthenticated();
  await keycloak.updateToken(30);

  if (!keycloak.token) {
    throw new Error('missing Keycloak access token');
  }

  return keycloak.token;
}

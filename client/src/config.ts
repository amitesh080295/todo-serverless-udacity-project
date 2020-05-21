// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = '7lh9foyye3'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'dev-ti3nhk8f.auth0.com', // Auth0 domain
  clientId: '36qJhXWCY47TLHWU3FbgHipLK6gww2xn', // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}

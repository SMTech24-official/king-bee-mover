import * as admin from 'firebase-admin';

const serviceAccount = require('../../firebase-admin-sdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});


export default admin;

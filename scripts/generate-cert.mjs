import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import selfsigned from 'selfsigned';

// Generates the self-signed certificate the development server is served with.
//
// The certificate is signed by this project rather than by a certificate
// authority, because no authority will vouch for 'localhost'. Browsers
// therefore warn that the connection is not private: the traffic is genuinely
// encrypted, but nobody independent has confirmed who the server is. That is
// expected for local development and is what the brief asks for.
//
// The generated files are ignored by git. A private key is the secret that
// proves the server's identity, so it is never committed; each developer runs
// this script once to create their own.

const keyPath = process.env.SSL_KEY_PATH ?? './certs/localhost-key.pem';
const certPath = process.env.SSL_CERT_PATH ?? './certs/localhost-cert.pem';

if (existsSync(keyPath) && existsSync(certPath) && !process.argv.includes('--force')) {
    console.log('Certificate already exists. Pass --force to replace it.');
    process.exit(0);
}

const { private: privateKey, cert } = await selfsigned.generate([{ name: 'commonName', value: 'localhost' }], {
    days: 365,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
        {
            // Modern clients ignore the common name and read the address from
            // here instead, so both the hostname and the loopback address are
            // listed to keep 'localhost' and '127.0.0.1' working.
            name: 'subjectAltName',
            altNames: [
                { type: 2, value: 'localhost' },
                { type: 7, ip: '127.0.0.1' },
            ],
        },
    ],
});

mkdirSync(dirname(keyPath), { recursive: true });
mkdirSync(dirname(certPath), { recursive: true });
writeFileSync(keyPath, privateKey);
writeFileSync(certPath, cert);

console.log(`Private key written to ${keyPath}`);
console.log(`Certificate written to ${certPath}`);
console.log('Valid for 365 days. These files are ignored by git and must not be committed.');

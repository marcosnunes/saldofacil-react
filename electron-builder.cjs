const identityName = process.env.MS_STORE_IDENTITY_NAME || 'MarcosNunes.SaldoFcil';
const publisher = process.env.MS_STORE_PUBLISHER || 'CN=A72FE73A-3E4B-4A02-BA11-61A5278E9134';
const publisherDisplayName = process.env.MS_STORE_PUBLISHER_DISPLAY_NAME || 'Marcos Roberto Nunes Lindolpho';

module.exports = {
  appId: 'com.autossuficiencia.saldofacil',
  productName: 'SaldoFacil',
  directories: {
    output: 'release',
  },
  files: ['dist/**/*', 'desktop/windows/**/*', 'package.json'],
  extraMetadata: {
    main: 'desktop/windows/main.cjs',
  },
  win: {
    target: [
      {
        target: 'appx',
        arch: ['x64'],
      },
    ],
  },
  appx: {
    applicationId: 'SaldoFacil',
    identityName,
    publisher,
    publisherDisplayName,
    displayName: 'SaldoFacil',
    backgroundColor: '#5e72e4',
    setBuildNumber: true,
  },
};

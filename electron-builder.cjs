const identityName = process.env.MS_STORE_IDENTITY_NAME || 'MarcosNunes.SaldoFcil';
const publisher = process.env.MS_STORE_PUBLISHER || 'CN=A72FE73A-3E4B-4A02-BA11-61A5278E9134';
const publisherDisplayName = process.env.MS_STORE_PUBLISHER_DISPLAY_NAME || 'Marcos Roberto Nunes Lindolpho';
const displayName = process.env.MS_STORE_DISPLAY_NAME || 'Saldo Fácil';

module.exports = {
  appId: 'com.autossuficiencia.saldofacil',
  productName: 'SaldoFacil',
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  directories: {
    output: 'release',
  },
  files: ['dist/**/*', 'desktop/windows/**/*', 'package.json'],
  extraMetadata: {
    main: 'desktop/windows/main.cjs',
  },
  win: {
    icon: 'public/app-icon.ico',
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
    displayName,
    backgroundColor: '#5e72e4',
    setBuildNumber: true,
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'SaldoFacil',
  },
};

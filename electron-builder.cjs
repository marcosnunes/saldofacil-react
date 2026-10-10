const identityName = process.env.MS_STORE_IDENTITY_NAME || '9694MarcosNunes.SaldoFcilIA';
const publisher = process.env.MS_STORE_PUBLISHER || 'CN=73B8D02F-B8A7-4931-B83C-70AFB7116E85';
const publisherDisplayName = process.env.MS_STORE_PUBLISHER_DISPLAY_NAME || 'Marcos Nunes';
const displayName = process.env.MS_STORE_DISPLAY_NAME || 'Saldo Fácil IA';

module.exports = {
  appId: 'com.autossuficiencia.saldofacil',
  productName: 'SaldoFacil',
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  directories: {
    output: 'release',
  },
  files: ['dist/**/*', 'desktop/windows/**/*', 'package.json'],
  extraResources: [
    {
      from: 'build/ai-runtime',
      to: 'ai-runtime',
      filter: ['**/*'],
    },
  ],
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

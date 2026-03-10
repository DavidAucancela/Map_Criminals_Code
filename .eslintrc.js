module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
  },
  globals: {
    // Leaflet global
    L: 'readonly',
    // App globals exposed between script.js and app.js
    addMarkers: 'readonly',
    flyToCountry: 'readonly',
    radarPing: 'readonly',
    showCountryCircle: 'readonly',
    zoomToMarker: 'readonly',
    worldMap: 'readonly',
    countryCircle: 'writable',
    toggleLang: 'readonly',
    selectCountry: 'readonly',
    exportCSV: 'readonly',
  },
};

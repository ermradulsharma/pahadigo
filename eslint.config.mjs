import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  {
    plugins: {
      import: nextConfig[0].plugins.import
    },
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
          jsx: 'always'
        }
      ],
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'warn'
    }
  }
];

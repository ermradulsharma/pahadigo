import nextConfig from 'eslint-config-next';

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'coverage/**',
      '.cache/**',
      'public/**',
      'logs/**',
      '*.log',
      'tests/**',
      'scripts/**'
    ]
  },
  ...nextConfig,
  {
    plugins: {
      ...nextConfig[0].plugins
    },
    rules: {
      'import/extensions': 'off',
      'import/no-anonymous-default-export': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn'
    }
  }
];

export default config;

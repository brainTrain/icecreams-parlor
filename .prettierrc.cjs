module.exports = {
  semi: true,
  tabWidth: 2,
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'avoid',
  bracketSameLine: false,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  useTabs: false,
  htmlWhitespaceSensitivity: 'css',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  singleAttributePerLine: false,
  overrides: [
    {
      files: ['*.tsx', '*.jsx'],
      options: {
        parser: 'typescript',
        plugins: ['@typescript-eslint/parser'],
      },
    },
    {
      files: ['*.tsx', '*.jsx'],
      options: {
        parser: 'babel-ts',
        plugins: ['@babel/parser'],
      },
    },
  ],
  plugins: ['@babel/parser'],
};

module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.json'],
      options: {
        printWidth: 80
      }
    },
    {
      files: ['*.md'],
      options: {
        printWidth: 100,
        proseWrap: 'always'
      }
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        singleQuote: false
      }
    }
  ]
};

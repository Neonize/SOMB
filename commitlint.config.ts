export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // always list standard types + your custom ones for clarity
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'blog',
        'newsletter',
      ]
    ]
  }
};

import upleveled, {
  noRestrictedSyntaxOptions as upleveledNoRestrictedSyntaxOptions,
} from 'eslint-config-upleveled';

/** @type {import('@typescript-eslint/utils').TSESLint.Linter.RuleLevelAndOptions} */
const noRestrictedSyntaxOptions = [
  // 'warn' included
  // eslint-disable-next-line rest-spread-spacing -- Allow JSDoc type cast
  .../** @type {import('@typescript-eslint/utils').TSESLint.Linter.RuleLevelAndOptions} */ (
    upleveledNoRestrictedSyntaxOptions.filter(
      (option) =>
        !/^Using document\.querySelectorAll\(\) can lead to problems|Using document\.getElementById\(\) can lead to problems/.test(
          /** @type {{message: string}} */ (option).message,
        ),
    )
  ),
];

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
const config = [
  ...upleveled,
  {
    rules: {
      'no-restricted-syntax': noRestrictedSyntaxOptions,
    },
  },
];

export default config;

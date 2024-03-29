/** @type {import("eslint").Linter.Config} */
module.exports = {
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended-type-checked",
		"plugin:@typescript-eslint/stylistic-type-checked",
		"plugin:import/recommended",
		"plugin:import/typescript",
	],
	parser: "@typescript-eslint/parser",
	ignorePatterns: ["dist", ".eslintrc.cjs"],
	rules: {
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/consistent-type-imports": "warn",
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{ ignoreRestSiblings: true, argsIgnorePattern: "^_$" },
		],
		"@typescript-eslint/consistent-type-imports": ["warn", { disallowTypeAnnotations: false }],
		"@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
		"@typescript-eslint/consistent-type-definitions": "off",
		"@typescript-eslint/array-type": "off",
		"@typescript-eslint/prefer-nullish-coalescing": ["error", { ignoreConditionalTests: true }],
		"import/order": [
			"warn",
			{
				groups: [
					"type",
					"builtin",
					"external",
					"internal",
					"parent",
					"sibling",
					"index",
					"object",
				],
				pathGroups: [
					{
						pattern: "@/**",
						group: "internal",
					},
				],
				alphabetize: {
					order: "asc",
					caseInsensitive: true,
				},
			},
		],
	},
};

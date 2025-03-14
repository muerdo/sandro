/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  globals: {
    React: "readonly"
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json"
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "no-duplicate-imports": "off",
    "import/no-duplicates": "off",
    "no-undef": "error",
    "no-unused-vars": "off",
    "import/no-unresolved": ["error", { "ignore": ["^geist/"] }],
    "react/prop-types": "off",
    "@next/next/no-img-element": "off",
    "import/named": "error",
    "react/no-unescaped-entities": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "prefer-const": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "import/no-named-as-default-member": "error",
    "react/no-unknown-property": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-empty-object-type": "off"
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "out/",
    "public/",
    "*.css",
    "*.scss"
  ],
  overrides: [
    {
      files: ["supabase/functions/**/*"],
      env: {
        browser: false,
        node: true,
        es6: true
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ],
  env: {
    browser: true,
    node: true,
    es6: true
  }
};

module.exports = config;

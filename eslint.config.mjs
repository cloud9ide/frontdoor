import { defineConfig } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends("eslint:recommended"),

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            before: true,
            describe: true,
            it: true,
            define: true,
        },
    },

    rules: {
        indent: ["error", 4, {
            SwitchCase: 1,
        }],

        "linebreak-style": ["error", "unix"],
        quotes: ["error", "double"],
        semi: ["error", "always"],

        "no-console": ["error", {
            allow: ["error"],
        }],

        "no-unused-vars": [2, {
            vars: "all",
            args: "none",
            caughtErrors: "none",
        }],

        "no-prototype-builtins": "off",
    },
}]);
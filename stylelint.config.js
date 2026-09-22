export default {
  extends: ["stylelint-config-standard"],
  overrides: [
    {
      /* Литеральные HEX допустимы только в tokens.css — единственном источнике цветов. */
      files: ["src/styles/tokens.css"],
      rules: {
        "color-no-hex": null,
      },
    },
  ],
  rules: {
    "declaration-property-value-keyword-no-deprecated": null,
  },
  ignoreFiles: ["dist/**", "coverage/**"],
};

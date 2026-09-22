export default {
  extends: ["stylelint-config-standard"],
  overrides: [
    {
      /* Литеральные HEX допустимы только в tokens.css — единственном источнике цветов. */
      files: ["src/styles/tokens.css"],
      rules: {
        "color-no-hex": null,
        /* HEX из §2.1 и rgba-производные §2.3 переносятся из дизайн-системы один в один. */
        "color-hex-length": null,
        "color-function-notation": null,
        "color-function-alias-notation": null,
        "alpha-value-notation": null,
      },
    },
  ],
  rules: {
    "declaration-property-value-keyword-no-deprecated": null,
  },
  ignoreFiles: ["dist/**", "coverage/**"],
};

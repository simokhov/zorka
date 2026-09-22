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
    /* CSS Modules: классы обращаются из TSX как s.camelCase. */
    "selector-class-pattern": "^[a-z][a-zA-Z0-9]*$",
    "declaration-property-value-keyword-no-deprecated": null,
  },
  ignoreFiles: ["dist/**", "coverage/**"],
};

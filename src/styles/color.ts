import { palette } from "./palette"

/**
 * Roles for colors.  Prefer using these over the palette.  It makes it easier
 * to change things.
 *
 * The only roles we need to place in here are the ones that span through the app.
 *
 * If you have a specific use-case, like a spinner color.  It makes more sense to
 * put that in the <Spinner /> component.
 */
export const color = {
  /**
   * The palette is available to use, but prefer using the name.
   */
  black: palette.black,
  white: palette.white,
  offWhite: palette.offWhite,
  orange: palette.orange,
  orangeDarker: palette.orangeDarker,
  orangeLight: palette.orangeLight,
  lightGrey: palette.lightGrey,
  lighterGrey: palette.lighterGrey,
  angry: palette.angry,
  deepPurple: palette.deepPurple,

  /**
   * A helper for making something see-thru. Use sparingly as many layers of transparency
   * can cause older Android devices to slow down due to the excessive compositing required
   * by their under-powered GPUs.
   */
  transparent: "rgba(0, 0, 0, 0)",
  /**
   * The screen background.
   */
  background: palette.white,
  /**
   * The main tinting color - Cociname brand color #FF5136
   */
  primary: palette.orange,
  /**
   * The main tinting color, but darker.
   */
  primaryDarker: palette.orangeDarker,
  /**
   * Light background variant with primary color - #FF51361A (10% opacity)
   */
  primaryLight: palette.orangeLight,
  /**
   * A subtle color used for borders and lines.
   */
  line: palette.offWhite,
  /**
   * The default color of text in many components.
   */
  text: palette.white,
  /**
   * Secondary information.
   */
  dim: palette.lightGrey,
  /**
   * Error messages and icons.
   */
  error: palette.angry,

  /**
   * Storybook background for Text stories, or any stories where
   * the text color is color.text, which is white by default, and does not show
   * in Stories against the default white background
   */
  storybookDarkBg: palette.black,

  /**
   * Storybook text color for stories that display Text components against the
   * white background
   */
  storybookTextColor: palette.black,

  /**
   * Primary color
   */
  primary900: "#1375C9",
  primary800: "#4E98D7",
  primary700: "#7BB2E1",
  primary600: "#9CC6E9",
  primary500: "#B5D5EF",
  primary400: "#C8E0F3",
  primary300: "#D6E8F6",
  primary200: "#EFF6FB",
  primary100: "#F9FBFD",

  /**
   * Secondary Color - Tonos de Cociname #FF5136
   */
  secondary900: "#FF5136",
  secondary800: "#FF6A52",
  secondary700: "#FF836E",
  secondary600: "#FF9C8A",
  secondary500: "#FFB5A6",
  secondary400: "#FFCEC2",
  secondary300: "#FFE7DE",
  secondary200: "#FFF3F0",
  secondary100: "#FFF9F8",

  /**
   * Dark color
   */
  dark900: "#253238",
  dark800: "#5C666A",
  dark700: "#A4A9AC",
  dark600: "#BBBFC1",
  dark500: "#CCCFD1",
  dark400: "#D9DBDD",
  dark300: "#E3E4E6",
  dark200: "#F1F1F2",
  dark100: "#F8F8F8",

  /**
   * Green color
   */
  green500: "#23A33F",
  green300: "#9CD7A8",
  green100: "#EEF8EF",

  /**
   * Yellow color
   */
  yellow500: "#FFB25B",
  yellow300: "#FFD8AD",
  yellow100: "#FFFAF4",

  /**
   * Body color
   */
  body300: "#F5F5F5",
  body200: "#F8F8F8",
  body100: "#FFFFFF",

  /**
   * Note to developers :
   * Please add new color below this line & follow the given format above
   * Thank you :D
   */

  /**
   * colorName900: "#F5F5F5",
   * colorName100: "#F5F5F5"
   */

  transparentDark: "rgba(0, 0, 0, 0.75)",
  transparentLight: "rgba(255,255,255,0.75)",
}

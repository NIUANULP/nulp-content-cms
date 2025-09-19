import AuthLogo from "../extensions/nulp.png";
import SidebarLogo from "../extensions/nulp-small.png";

export default {
  config: {
    auth: {
      logo: AuthLogo,
    },
    menu: {
      logo: SidebarLogo,
    },
    translations: {
      en: {
        "Auth.form.welcome.title": "Welcome to NULP!",
        "Auth.form.welcome.subtitle": "Log in to your NULP account",
      },
    },
    theme: {
      light: {
        colors: {
          primary100: "#e6edf1",
          primary200: "#c2d3dc",
          primary500: "#1b4b66",
          primary600: "#173e55",
          primary700: "#133446",
          buttonPrimary500: "#1b4b66",
          buttonPrimary600: "#1b4b66",
          buttonPrimary700: "#133446",
        },
      },
      dark: {
        colors: {
          primary100: "#153545",
          primary200: "#1a4154",
          primary500: "#1b4b66",
          primary600: "#1d5776",
          primary700: "#22688e",
          buttonPrimary500: "#1b4b66",
          buttonPrimary600: "#1b4b66",
          buttonPrimary700: "#133446",
        },
      },
    },
  },
  bootstrap() {},
};
import React from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {AppRegistry} from 'react-native';
import "./index.css";
import Navigator from "./routes";
import { AuthProvider } from "@anilist-fe/app/src/hooks/useAuth";

export function App(): JSX.Element {
  return (
    <AuthProvider>
      <Navigator/>
    </AuthProvider>
  );
}

AppRegistry.registerComponent('main', () => App);

// Ensure DOM is ready before running application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const rootTag = document.getElementById('root');
    if (rootTag) {
      AppRegistry.runApplication('main', { rootTag });
    }
  });
} else {
  const rootTag = document.getElementById('root');
  if (rootTag) {
    AppRegistry.runApplication('main', { rootTag });
  }
}

import React from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {AppRegistry, View} from 'react-native';
import "./index.css";
import Navigator from "./routes";
import { AuthProvider } from "@anilist-fe/app/src/hooks/useAuth";

export function App(): JSX.Element {
  return (
    <AuthProvider>
      <View style={{height: '100vh'}}>
        <Navigator/>
      </View>
    </AuthProvider>
  );
}

AppRegistry.registerComponent('main', () => App);
AppRegistry.runApplication('main', {
  rootTag: document.getElementById('root'),
});

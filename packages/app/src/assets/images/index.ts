import { Platform } from 'react-native';

export const images = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  logo: Platform.OS === 'web' 
    ? require('./logo.png').default || require('./logo.png')
    : require('./logo.png')
};

import { Platform } from 'react-native';

export const images = {
  logo: Platform.OS === 'web' 
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ? require('./logo.png').default || require('./logo.png')
    : require('./logo.png')
};

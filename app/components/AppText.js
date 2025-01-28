// components/AppText.js
import { Text } from 'react-native';
import globalStyles from '../styles/globalStyles';

export default function AppText({ children, style, ...props }) {
  return (
    <Text style={[globalStyles.defaultFont, style]} {...props}>
      {children}
    </Text>
  );
}

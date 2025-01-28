import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

interface TextProps extends RNTextProps {
  medium?: boolean;
  bold?: boolean;
}

export function Text({ style, medium, bold, ...props }: TextProps) {
  const fontFamily = bold
    ? 'Figtree-Bold'
    : medium
    ? 'Figtree-Medium'
    : 'Figtree';

  return <RNText style={[{ fontFamily }, style]} {...props} />;
} 
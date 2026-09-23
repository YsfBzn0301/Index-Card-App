import { ColorSchemeName } from 'react-native';

export type AppTheme = ReturnType<typeof createTheme>;

const light = {
  background: '#FFF8F1',
  surface: '#FFFFFF',
  elevated: '#F7EFE7',
  text: '#1E1B18',
  muted: '#756B61',
  border: '#E8D8C8',
  tab: '#FFFDF9',
  primary: '#FF5A7A',
  secondary: '#24B8A8',
  warning: '#F6A935',
  success: '#4CBE6C',
  gradientStart: '#FF7A59',
  gradientEnd: '#23C6B7',
};

const dark = {
  background: '#14120F',
  surface: '#211D19',
  elevated: '#2E2923',
  text: '#FFF7EF',
  muted: '#C9B8A7',
  border: '#42372E',
  tab: '#1C1814',
  primary: '#FF7890',
  secondary: '#41D4C4',
  warning: '#FFC05C',
  success: '#6DDA89',
  gradientStart: '#E95F3C',
  gradientEnd: '#18A998',
};

export const deckAccents = ['#FF5A7A', '#24B8A8', '#7B61FF', '#F6A935', '#4CBE6C', '#35A7FF'];

export function createTheme(colorScheme: ColorSchemeName) {
  return colorScheme === 'dark' ? dark : light;
}

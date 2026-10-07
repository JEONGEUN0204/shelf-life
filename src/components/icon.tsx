import { SymbolView, type SymbolViewProps } from 'expo-symbols';

type IconProps = {
  /** iOS는 SF Symbol, Android/web은 Material Symbol 이름 */
  name: SymbolViewProps['name'];
  color: string;
  size?: number;
};

export function Icon({ name, color, size = 20 }: IconProps) {
  return <SymbolView name={name} tintColor={color} size={size} />;
}

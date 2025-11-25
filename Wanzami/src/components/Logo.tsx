import Image from 'next/image';
import logoImage from '../assets/2215741b8da2bc4285ab58bd4c4d390d4183910f.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'splash';
  className?: string;
}

export function Logo({ size = 'medium', className = '' }: LogoProps) {
  const sizeMap = {
    small: 32,
    medium: 40,
    large: 64,
    splash: 128,
  };
  const dimension = sizeMap[size] ?? sizeMap.medium;

  return (
    <Image
      src={logoImage}
      alt="Wanzami"
      width={dimension}
      height={dimension}
      className={className}
      priority={size === 'splash'}
    />
  );
}

import logoImage from '../assets/2215741b8da2bc4285ab58bd4c4d390d4183910f.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'splash';
  className?: string;
}

export function Logo({ size = 'medium', className = '' }: LogoProps) {
  const sizeClasses = {
    small: 'h-8 w-auto',
    medium: 'h-10 w-auto',
    large: 'h-16 w-auto',
    splash: 'h-24 md:h-32 w-auto'
  };

  return (
    <img
      src={logoImage}
      alt="Wanzami"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}

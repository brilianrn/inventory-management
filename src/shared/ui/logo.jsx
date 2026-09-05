import Image from 'next/image';

export const Logo = ({ className = 'h-7 w-auto' }) => (
  <Image
    src="/logo-amb.png"
    alt="amb"
    width={480}
    height={234}
    priority
    className={className}
  />
);

export default Logo;

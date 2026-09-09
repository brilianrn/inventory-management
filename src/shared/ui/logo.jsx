import Image from 'next/image';

export const Logo = ({ className = 'h-7 w-auto' }) => (
  <Image
    src="/logo-amb.png"
    alt="amb"
    width={640}
    height={196}
    priority
    className={className}
  />
);

export default Logo;

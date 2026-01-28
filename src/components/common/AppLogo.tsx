import Image from 'next/image';

const AppLogo = () => {
  return (
    <Image
      src="/images/logo.png"
      alt="NS Conseil Logo"
      width={120}
      height={32}
      priority
    />
  );
};

export default AppLogo;

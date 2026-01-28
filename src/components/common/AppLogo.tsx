import Image from 'next/image';

const AppLogo = () => {
  return (
    <div className="flex items-center" style={{ height: '32px' }}>
      <Image
        src="/images/logo.png"
        alt="envoi mail J-4 Logo"
        width={150}
        height={32}
        priority
      />
    </div>
  );
};

export default AppLogo;

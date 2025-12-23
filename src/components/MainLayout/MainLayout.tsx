type Props = {
  children: React.ReactNode;
};

const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="w-[100dvw] h-[100dvh] bg-[#3c7a33] text-white font-press-start flex flex-col justify-center items-center">
      <div className="p-5 flex flex-col justify-center md:max-w-[350px]">{children}</div>
    </div>
  );
};

export default MainLayout;

type Props = {
  children: React.ReactNode;
};

/**
 * The frame every page is rendered into: a fixed, full-viewport box with the page centred in it.
 *
 * The centring is `my-auto` on the inner box rather than `justify-center` on the outer one, and the
 * outer one scrolls rather than clipping. A flex container that centres with `justify-center` and
 * then overflows pushes the first part of its content *above* the scroll origin, where no scrolling
 * can reach it — on a viewport shorter than the page, that silently ate the page header. Auto
 * margins collapse to nothing once the content overflows, so the top stays reachable.
 *
 * The inner box is padded horizontally only. Vertical padding would add to a page that already asks
 * for the full viewport height (`min-h-screen`), putting every such page permanently over the fold;
 * `my-auto` already provides the breathing room whenever there is room to give.
 */
const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="w-[100dvw] h-[100dvh] bg-[#3c7a33] text-white font-press-start flex flex-col items-center h-screen overflow-y-auto fixed w-full">
      <div className="px-5 my-auto flex flex-col justify-center md:max-w-[350px]">{children}</div>
    </div>
  );
};

export default MainLayout;

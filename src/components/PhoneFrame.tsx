import { useEffect, useState, type ReactNode } from 'react';

/** Wide windows (desktop preview) get a phone frame; phone-width screens render edge to edge. */
// Phones are narrower than 480 CSS px, so anything wider is a preview window.
const FRAME_QUERY = '(min-width: 480px)';
// Frame outer size: 402×874 screen plus the 12 px bezel on each side, and 24 px breathing room.
const FRAME_HEIGHT = 874 + 12 * 2;
const FRAME_WIDTH = 402 + 12 * 2;
const MARGIN = 24;

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Scale the device down so the whole phone fits in short windows. */
function useFitScale() {
  const compute = () => Math.min(1, (window.innerHeight - MARGIN * 2) / FRAME_HEIGHT, (window.innerWidth - MARGIN * 2) / FRAME_WIDTH);
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

export function PhoneFrame({ children }: { children: ReactNode }) {
  const framed = useMediaQuery(FRAME_QUERY);
  const scale = useFitScale();
  if (!framed) return <>{children}</>;
  return (
    <div className="device-stage">
      <div className="device" style={{ transform: `scale(${scale})` }}>
        {/* The screen is the containing block for the fixed nav and toast, so they stay inside the phone. */}
        <div className="device__screen">
          <div className="device__scroll" data-scroll-root>
            {children}
          </div>
          <span className="device__island" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

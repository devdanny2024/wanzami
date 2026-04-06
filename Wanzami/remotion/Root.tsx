import {Composition} from 'remotion';
import {WanzamiPromo, type WanzamiPromoProps} from './compositions/WanzamiPromo';

const defaultProps: WanzamiPromoProps = {
  prompt: 'A cinematic teaser for Wanzami: stream African stories, live events, and exclusive premieres.',
  cta: 'Watch now on Wanzami.tv',
  vibe: 'cinematic',
  accentColor: '#f59e0b',
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WanzamiPromo"
        component={WanzamiPromo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};

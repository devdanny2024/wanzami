import {Composition} from 'remotion';
import {WanzamiPromo, type WanzamiPromoProps} from './compositions/WanzamiPromo';

const defaultProps: WanzamiPromoProps = {
  prompt: 'African stories. Live moments. Premium streaming at your fingertips.',
  cta: 'Start Streaming on Wanzami',
  vibe: 'cinematic',
  accentColor: '#fd7e14',
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

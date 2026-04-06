import {Composition} from 'remotion';
import {WanzamiHypeTeaser} from './compositions/WanzamiHypeTeaser';
import {WanzamiHypeTeaserPoster} from './compositions/WanzamiHypeTeaserPoster';
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
      <Composition
        id="WanzamiHypeTeaser"
        component={WanzamiHypeTeaser}
        durationInFrames={480}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          opener: 'What is Wanzami?',
          closer: 'What is Wanzami?',
          accentColor: '#fd7e14',
        }}
      />
      <Composition
        id="WanzamiHypeTeaserPoster"
        component={WanzamiHypeTeaserPoster}
        durationInFrames={480}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          opener: 'What is Wanzami?',
          closer: 'What is Wanzami?',
          accentColor: '#fd7e14',
        }}
      />
    </>
  );
};

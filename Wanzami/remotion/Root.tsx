import {Composition} from 'remotion';
import {WanzamiHypeTeaser} from './compositions/WanzamiHypeTeaser';
import {WanzamiHypeTeaserPoster} from './compositions/WanzamiHypeTeaserPoster';
import {WanzamiPromo, type WanzamiPromoProps} from './compositions/WanzamiPromo';
import {WanzamiPulseTrailer} from './compositions/WanzamiPulseTrailer';
import {WanzamiLaunch, WanzamiLaunch169} from './compositions/WanzamiLaunch';

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
      <Composition
        id="WanzamiPulseTrailer"
        component={WanzamiPulseTrailer}
        durationInFrames={480}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          hook: 'What is Wanzami?',
          cta: 'START WATCHING',
          accentColor: '#fd7e14',
        }}
      />
      <Composition
        id="WanzamiLaunch"
        component={WanzamiLaunch}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{portrait: true}}
      />
      <Composition
        id="WanzamiLaunch169"
        component={WanzamiLaunch169}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};

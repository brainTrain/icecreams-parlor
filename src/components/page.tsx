import styled from 'styled-components';
import BrowserSynth from './browser-synth';
import DrumMachine from './drum-machine';
import Chorus from './chorus';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #121212;
  padding: 2rem;
  gap: 2rem;
`;

const Title = styled.h1`
  color: #ffffff;
  margin-bottom: 2rem;
`;

const Section = styled.div`
  width: 100%;
  max-width: 800px;
`;

function Page() {
  return (
    <PageContainer>
      <Title>Browser Synth</Title>
      <Section>{/* <BrowserSynth /> */}</Section>
      <Section>{/* <DrumMachine /> */}</Section>
      <Section>
        <Chorus />
      </Section>
    </PageContainer>
  );
}

export default Page;

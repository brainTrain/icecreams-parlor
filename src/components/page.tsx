import styled from 'styled-components';
import BrowserSynth from './browser-synth';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #121212;
  padding: 2rem;
`;

const Title = styled.h1`
  color: #ffffff;
  margin-bottom: 2rem;
`;

function Page() {
  return (
    <PageContainer>
      <Title>Browser Synth</Title>
      <BrowserSynth />
    </PageContainer>
  );
}

export default Page;

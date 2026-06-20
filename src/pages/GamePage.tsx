import PacmanGame from '@/components/game/PacmanGame';

const GamePage = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <PacmanGame />
    </div>
  );
};

export default GamePage;

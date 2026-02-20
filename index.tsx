import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [screen, setScreen] = useState<'main' | 'create' | 'join' | 'lobby' | 'game'>('main');
  const [gameCode, setGameCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [playerRole, setPlayerRole] = useState('');

  const createGame = () => {
    if (playerName) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setGameCode(code);
      setPlayers([playerName]);
      setIsHost(true);
      setScreen('lobby');
    }
  };

  const joinGame = () => {
    if (inputCode && playerName) {
      setGameCode(inputCode);
      setPlayers([...players, playerName]);
      setScreen('lobby');
    }
  };

  const startGame = () => {
    const roles = ['Мафия', 'Мафия', 'Шериф', 'Мирный', 'Мирный', 'Мирный'];
    const shuffled = [...roles].sort(() => Math.random() - 0.5);
    setPlayerRole(shuffled[0]);
    setScreen('game');
  };

  const styles = {
    container: {
      padding: '20px',
      background: '#1a1a2e',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'sans-serif'
    } as const,
    card: {
      maxWidth: '500px',
      margin: '0 auto',
      background: '#16213e',
      borderRadius: '20px',
      padding: '20px'
    } as const,
    title: {
      textAlign: 'center' as const,
      marginBottom: '20px'
    } as const,
    mainButtons: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      gap: '10px'
    } as const,
    createButton: {
      padding: '15px',
      background: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '18px',
      cursor: 'pointer'
    } as const,
    joinMainButton: {
      padding: '15px',
      background: '#304ffe',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '18px',
      cursor: 'pointer'
    } as const,
    joinButton: {
      padding: '15px',
      background: '#304ffe',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '18px',
      cursor: 'pointer',
      marginBottom: '10px'
    } as const,
    backButton: {
      padding: '10px',
      background: '#666',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    } as const,
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '10px',
      borderRadius: '5px',
      border: 'none',
      boxSizing: 'border-box' as const
    } as const,
    codeBox: {
      background: '#0f3460',
      padding: '15px',
      borderRadius: '10px',
      textAlign: 'center' as const,
      fontSize: '24px',
      marginBottom: '20px'
    } as const,
    playersBox: {
      marginBottom: '20px'
    } as const,
    playerItem: {
      background: '#0f3460',
      padding: '10px',
      marginBottom: '5px',
      borderRadius: '5px'
    } as const,
    roleBox: {
      background: '#0f3460',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      textAlign: 'center' as const,
      fontSize: '20px'
    } as const
  };

  if (screen === 'main') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🕵️ Мафия</h1>
          <div style={styles.mainButtons}>
            <button onClick={() => setScreen('create')} style={styles.createButton}>
              Создать игру
            </button>
            <button onClick={() => setScreen('join')} style={styles.joinMainButton}>
              Войти в игру
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'create') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🎮 Создать игру</h1>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Твоё имя"
            style={styles.input}
          />
          <button onClick={createGame} style={styles.createButton}>
            Создать
          </button>
          <button onClick={() => setScreen('main')} style={styles.backButton}>
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'join') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🔑 Войти в игру</h1>
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="Код игры"
            style={styles.input}
          />
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Твоё имя"
            style={styles.input}
          />
          <button onClick={joinGame} style={styles.joinButton}>
            Войти
          </button>
          <button onClick={() => setScreen('main')} style={styles.backButton}>
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'lobby') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🕵️ Лобби</h1>
          <div style={styles.codeBox}>
            Код игры: <strong>{gameCode}</strong>
          </div>
          <div style={styles.playersBox}>
            <h3 style={{ color: 'white' }}>Игроки ({players.length}/6):</h3>
            {players.map((p, i) => (
              <div key={i} style={styles.playerItem}>
                {p} {i === 0 && '(ведущий)'}
              </div>
            ))}
          </div>
          {isHost && players.length >= 3 && (
            <button onClick={startGame} style={styles.createButton}>
              Начать игру 🚀
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎮 Игра началась!</h1>
        <div style={styles.roleBox}>
          Твоя роль: <strong>{playerRole}</strong>
        </div>
        <div style={styles.playersBox}>
          <h3 style={{ color: 'white' }}>Игроки:</h3>
          {players.map((p, i) => (
            <div key={i} style={styles.playerItem}>
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
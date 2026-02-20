import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// ===== КОНФИГУРАЦИЯ =====
const SERVER_URL = 'wss://mafia-server-1kb7.onrender.com';
const ADSGRAM_BLOCK_ID = 'your-block-id'; // Сюда вставишь ID после регистрации в AdsGram

// ===== ТИПЫ =====
interface Player {
  name: string;
  isHost?: boolean;
}

interface GameState {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  playerRole: string;
  gamePhase: 'lobby' | 'night' | 'day' | 'voting' | 'end';
  alivePlayers: string[];
}

// ===== ОСНОВНОЙ КОМПОНЕНТ =====
function App() {
  // Состояния
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [screen, setScreen] = useState<'main' | 'create' | 'join' | 'lobby' | 'game'>('main');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [playerRole, setPlayerRole] = useState('');
  const [gamePhase, setGamePhase] = useState('lobby');
  const [balance, setBalance] = useState(0);
  const [alivePlayers, setAlivePlayers] = useState<string[]>([]);
  const [tg, setTg] = useState<any>(null);

  // Инициализация Telegram
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      webapp.ready();
      webapp.expand();
      setTg(webapp);
      
      // Получаем имя из Telegram, если есть
      const tgUser = webapp.initDataUnsafe?.user;
      if (tgUser?.first_name) {
        setPlayerName(tgUser.first_name);
      }
    }
  }, []);

  // WebSocket подключение
  useEffect(() => {
    const ws = new WebSocket(SERVER_URL);
    setSocket(ws);

    ws.onopen = () => {
      console.log('✅ Подключено к серверу');
      if (tg) {
        tg.HapticFeedback?.notificationOccurred('success');
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 Получено:', data);

      switch (data.type) {
        case 'created':
          setRoomCode(data.roomCode);
          setPlayers(data.players);
          setIsHost(true);
          setAlivePlayers(data.players);
          setScreen('lobby');
          if (tg) {
            tg.HapticFeedback?.impactOccurred('medium');
          }
          break;

        case 'joined':
          setRoomCode(data.roomCode);
          setPlayers(data.players);
          setAlivePlayers(data.players);
          setScreen('lobby');
          if (tg) {
            tg.HapticFeedback?.impactOccurred('light');
          }
          break;

        case 'playersUpdate':
          setPlayers(data.players);
          setAlivePlayers(data.players);
          break;

        case 'roleAssigned':
          setPlayerRole(data.role);
          if (tg) {
            tg.HapticFeedback?.notificationOccurred('success');
          }
          break;

        case 'gameStarted':
          setGamePhase(data.phase);
          setScreen('game');
          if (tg) {
            tg.HapticFeedback?.impactOccurred('heavy');
          }
          break;

        case 'nightResult':
          alert(`☠️ Ночью был убит: ${data.killed || 'никого'}`);
          setAlivePlayers(prev => prev.filter(p => p !== data.killed));
          setGamePhase('day');
          break;

        case 'votingResult':
          if (data.eliminated) {
            alert(`🗳️ По результатам голосования ушёл: ${data.eliminated}`);
            setAlivePlayers(prev => prev.filter(p => p !== data.eliminated));
          }
          setGamePhase('night');
          break;

        case 'error':
          alert(data.message);
          if (tg) {
            tg.HapticFeedback?.notificationOccurred('error');
          }
          break;
      }
    };

    ws.onclose = () => {
      console.log('❌ Отключено от сервера');
    };

    return () => ws.close();
  }, [tg]);

  // ===== ФУНКЦИИ ИГРЫ =====
  const createGame = () => {
    if (playerName && socket) {
      socket.send(JSON.stringify({
        type: 'create',
        playerName
      }));
      if (tg) {
        tg.HapticFeedback?.impactOccurred('light');
      }
    }
  };

  const joinGame = () => {
    if (inputCode && playerName && socket) {
      socket.send(JSON.stringify({
        type: 'join',
        roomCode: inputCode,
        playerName
      }));
      if (tg) {
        tg.HapticFeedback?.impactOccurred('light');
      }
    }
  };

  const startGame = () => {
    if (socket && roomCode) {
      socket.send(JSON.stringify({
        type: 'start',
        roomCode
      }));
    }
  };

  const sendNightAction = (action: string) => {
    if (socket && roomCode && playerName) {
      socket.send(JSON.stringify({
        type: 'nightAction',
        roomCode,
        playerName,
        action
      }));
      if (tg) {
        tg.HapticFeedback?.impactOccurred('light');
      }
    }
  };

  const sendVote = (target: string) => {
    if (socket && roomCode && playerName) {
      socket.send(JSON.stringify({
        type: 'vote',
        roomCode,
        playerName,
        target
      }));
      if (tg) {
        tg.HapticFeedback?.impactOccurred('light');
      }
    }
  };

  // ===== МОНЕТИЗАЦИЯ =====
  const shareGame = () => {
    if (roomCode) {
      const gameUrl = `https://t.me/share/url?url=${window.location.origin}&text=🎮 Сыграем в мафию? Код комнаты: ${roomCode}`;
      if (tg) {
        tg.openTelegramLink(gameUrl);
        tg.HapticFeedback?.impactOccurred('light');
      } else {
        window.open(gameUrl, '_blank');
      }
    }
  };

  const buyRole = (role: string, cost: number) => {
    if (!tg) return;

    // Здесь будет интеграция с Telegram Stars
    tg.showPopup({
      title: 'Покупка роли',
      message: `Купить роль "${role}" за ${cost} ⭐️?`,
      buttons: [
        { id: 'buy', type: 'default', text: 'Купить' },
        { id: 'cancel', type: 'cancel', text: 'Отмена' }
      ]
    }, (buttonId) => {
      if (buttonId === 'buy') {
        // Здесь вызов оплаты через Telegram Stars
        alert(`✨ Покупка роли "${role}" за ${cost} ⭐️`);
        setBalance(prev => prev - cost);
      }
    });
  };

  const showRewardedAd = () => {
    if (typeof window.Adsgram !== 'undefined') {
      const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
      
      AdController.show().then(() => {
        setBalance(prev => prev + 50);
        alert('🎉 +50 ⭐️ за просмотр рекламы!');
        if (tg) {
          tg.HapticFeedback?.notificationOccurred('success');
        }
      }).catch((error) => {
        console.log('Ошибка показа рекламы', error);
        if (tg) {
          tg.HapticFeedback?.notificationOccurred('error');
        }
      });
    }
  };

  // ===== СТИЛИ =====
  const styles = {
    container: {
      padding: '20px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--tg-theme-bg-color, #1a1a2e)',
      color: 'var(--tg-theme-text-color, #fff)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    } as const,
    card: {
      maxWidth: '480px',
      width: '100%',
      margin: '0 auto',
      background: 'var(--tg-theme-secondary-bg-color, #16213e)',
      borderRadius: '24px',
      padding: '32px 24px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      animation: 'fadeIn 0.3s ease forwards'
    } as const,
    title: {
      textAlign: 'center' as const,
      marginBottom: '32px',
      fontSize: '32px',
      fontWeight: 'bold',
      color: 'var(--tg-theme-text-color, #fff)'
    } as const,
    mainButtons: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      gap: '16px',
      marginTop: '20px'
    } as const,
    createButton: {
      padding: '16px',
      background: 'var(--tg-theme-button-color, #304ffe)',
      color: 'var(--tg-theme-button-text-color, white)',
      border: 'none',
      borderRadius: '14px',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%'
    } as const,
    joinMainButton: {
      padding: '16px',
      background: 'transparent',
      color: 'var(--tg-theme-text-color, white)',
      border: '2px solid var(--tg-theme-button-color, #304ffe)',
      borderRadius: '14px',
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%'
    } as const,
    backButton: {
      padding: '12px',
      background: 'transparent',
      color: 'var(--tg-theme-hint-color, #666)',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      cursor: 'pointer',
      marginTop: '16px',
      width: '100%'
    } as const,
    input: {
      width: '100%',
      padding: '14px',
      marginBottom: '12px',
      borderRadius: '12px',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'var(--tg-theme-text-color, #fff)',
      fontSize: '16px',
      outline: 'none'
    } as const,
    codeBox: {
      background: 'rgba(48, 79, 254, 0.1)',
      padding: '20px',
      borderRadius: '16px',
      textAlign: 'center' as const,
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '24px',
      border: '2px solid var(--tg-theme-button-color, #304ffe)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px'
    } as const,
    playersBox: {
      marginBottom: '24px'
    } as const,
    playerItem: {
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '12px 16px',
      marginBottom: '8px',
      borderRadius: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    } as const,
    phaseBox: {
      background: 'rgba(48, 79, 254, 0.2)',
      padding: '12px',
      borderRadius: '12px',
      marginBottom: '24px',
      textAlign: 'center' as const,
      fontSize: '20px',
      fontWeight: '600',
      border: '2px solid var(--tg-theme-button-color, #304ffe)'
    } as const,
    roleBox: {
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '20px',
      borderRadius: '16px',
      marginBottom: '24px',
      textAlign: 'center' as const,
      fontSize: '24px'
    } as const,
    actionButton: {
      padding: '12px',
      margin: '6px',
      background: 'var(--tg-theme-button-color, #304ffe)',
      color: 'var(--tg-theme-button-text-color, white)',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      cursor: 'pointer',
      minWidth: '100px'
    } as const,
    shopButton: {
      padding: '12px',
      margin: '6px',
      background: 'rgba(255, 215, 0, 0.2)',
      color: 'gold',
      border: '2px solid gold',
      borderRadius: '10px',
      fontSize: '14px',
      cursor: 'pointer'
    } as const,
    shopSection: {
      marginTop: '24px',
      padding: '16px',
      background: 'rgba(255, 215, 0, 0.05)',
      borderRadius: '16px'
    } as const,
    shareButton: {
      padding: '8px 16px',
      background: 'transparent',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      transition: 'transform 0.2s'
    } as const
  };

  // ===== ЭКРАНЫ =====
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
          <button onClick={showRewardedAd} style={{...styles.backButton, marginTop: '32px'}}>
            🎬 Заработать ⭐️
          </button>
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
          <button onClick={joinGame} style={styles.createButton}>
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
            {roomCode}
            <button onClick={shareGame} style={styles.shareButton}>
              🔗
            </button>
          </div>
          <div style={styles.playersBox}>
            <h3 style={{ marginBottom: '16px' }}>Игроки ({players.length}/6):</h3>
            {players.map((p, i) => (
              <div key={i} style={styles.playerItem}>
                <span>{p}</span>
                {i === 0 && <span style={{ color: 'var(--tg-theme-hint-color)' }}>👑</span>}
              </div>
            ))}
          </div>
          {isHost && players.length >= 3 && (
            <button onClick={startGame} style={styles.createButton}>
              Начать игру 🚀
            </button>
          )}
          
          {/* Магазин ролей */}
          <div style={styles.shopSection}>
            <h3 style={{ textAlign: 'center', marginBottom: '12px' }}>✨ Магазин ролей ✨</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => buyRole('Дон', 50)} style={styles.shopButton}>
                👑 Дон (50⭐)
              </button>
              <button onClick={() => buyRole('Шериф', 30)} style={styles.shopButton}>
                🔍 Шериф (30⭐)
              </button>
              <button onClick={() => buyRole('Доктор', 25)} style={styles.shopButton}>
                💊 Доктор (25⭐)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Экран игры
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.phaseBox}>
          {gamePhase === 'night' && '🌙 Ночь'}
          {gamePhase === 'day' && '☀️ День'}
          {gamePhase === 'voting' && '🗳️ Голосование'}
          {gamePhase === 'end' && '🏁 Игра окончена'}
        </div>
        
        <div style={styles.roleBox}>
          <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)', marginBottom: '8px' }}>
            Твоя роль
          </div>
          <strong>{playerRole || 'Наблюдатель'}</strong>
        </div>

        {gamePhase === 'night' && playerRole === 'Мафия' && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>🔪 Кого убиваем?</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {alivePlayers.filter(p => p !== playerName).map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendNightAction(JSON.stringify({ type: 'kill', target: p }))}
                  style={styles.actionButton}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {gamePhase === 'day' && isHost && (
          <button onClick={() => setGamePhase('voting')} style={{...styles.createButton, marginBottom: '24px'}}>
            Начать голосование
          </button>
        )}

        {gamePhase === 'voting' && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>🗳️ Кого исключаем?</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {alivePlayers.filter(p => p !== playerName).map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendVote(p)}
                  style={styles.actionButton}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={styles.playersBox}>
          <h3 style={{ marginBottom: '16px' }}>Живы ({alivePlayers.length})</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {alivePlayers.map((p, i) => (
              <div key={i} style={{
                ...styles.playerItem,
                flex: '1 0 calc(50% - 4px)',
                marginBottom: 0,
                background: p === playerRole ? 'rgba(48, 79, 254, 0.3)' : 'rgba(255, 255, 255, 0.05)'
              }}>
                {p}
              </div>
            ))}
          </div>
        </div>

        <button onClick={showRewardedAd} style={styles.backButton}>
          🎬 Смотреть рекламу (+50⭐)
        </button>
      </div>
    </div>
  );
}

// ===== ЗАПУСК =====
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
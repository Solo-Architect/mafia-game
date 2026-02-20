import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// ===== ТИПЫ =====
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback: (status: string) => void) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'success' | 'error' | 'warning') => void;
        };
        showPopup: (params: any, callback?: (buttonId: string) => void) => void;
      };
    };
  }
}

// ===== КОНФИГ =====
const SERVER_URL = 'wss://mafia-server-1kb7.onrender.com';

// ===== ТОВАРЫ (20+ штук) =====
const shopItems = [
  // Роли
  { id: 1, name: '👑 Дон', desc: 'Глава мафии, голос решающий', price: 70, category: 'role' },
  { id: 2, name: '🔍 Шериф', desc: 'Ночью проверяет одного', price: 60, category: 'role' },
  { id: 3, name: '💊 Доктор', desc: 'Может спасти одну ночью', price: 55, category: 'role' },
  { id: 4, name: '🔪 Мафия', desc: 'Убивает ночью', price: 50, category: 'role' },
  { id: 5, name: '🕵️ Детектив', desc: 'Видит роль убитого', price: 65, category: 'role' },
  { id: 6, name: '🛡️ Телохранитель', desc: 'Защищает игрока', price: 60, category: 'role' },
  { id: 7, name: '⚡ Вигилант', desc: 'Может убить раз за игру', price: 70, category: 'role' },
  { id: 8, name: '🔮 Ясновидящий', desc: 'Узнаёт мафию раз в игру', price: 65, category: 'role' },
  // Бусты
  { id: 9, name: '🛡️ Защита', desc: 'Неуязвимость на ночь', price: 40, category: 'boost' },
  { id: 10, name: '🗳️ Двойной голос', desc: 'Твой голос считается дважды', price: 45, category: 'boost' },
  { id: 11, name: '⚔️ Месть', desc: 'Убиваешь своего убийцу', price: 55, category: 'boost' },
  { id: 12, name: '💪 Сила', desc: 'Твой голос ломает ничью', price: 50, category: 'boost' },
  { id: 13, name: '🎭 Маскировка', desc: 'Тебя не видит шериф', price: 50, category: 'boost' },
  { id: 14, name: '🌀 Хаос', desc: 'Ночью все ходы случайны', price: 60, category: 'boost' },
  // Скины
  { id: 15, name: '👻 Невидимка', desc: 'Прозрачный аватар', price: 35, category: 'skin' },
  { id: 16, name: '💀 Череп', desc: 'Стиль мафии', price: 40, category: 'skin' },
  { id: 17, name: '👑 Золотая корона', desc: 'Для дона', price: 50, category: 'skin' },
  { id: 18, name: '🌈 Цветное имя', desc: 'Радуга в чате', price: 30, category: 'skin' },
  { id: 19, name: '🔥 Огненный ник', desc: 'Горит в чате', price: 45, category: 'skin' },
  { id: 20, name: '💎 VIP-статус', desc: 'Особый значок', price: 100, category: 'skin' },
  { id: 21, name: '🌙 Лунный', desc: 'Лунный нимб', price: 55, category: 'skin' },
  { id: 22, name: '⚡ Молния', desc: 'Эффект молнии', price: 60, category: 'skin' },
];

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [screen, setScreen] = useState<'main' | 'create' | 'join' | 'lobby' | 'game'>('main');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [playerRole, setPlayerRole] = useState('');
  const [gamePhase, setGamePhase] = useState('lobby');
  const [alivePlayers, setAlivePlayers] = useState<string[]>([]);
  const [tg, setTg] = useState<any>(null);
  const [starsBalance, setStarsBalance] = useState(0);
  const [ownedItems, setOwnedItems] = useState<number[]>([]);
  const [maxPlayers, setMaxPlayers] = useState<number>(6); // по умолчанию 6

  // Инициализация Telegram
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      webapp.ready();
      webapp.expand();
      setTg(webapp);
      
      const tgUser = webapp.initDataUnsafe?.user;
      if (tgUser?.first_name) {
        setPlayerName(tgUser.first_name);
      }

      const saved = localStorage.getItem('ownedItems');
      if (saved) {
        setOwnedItems(JSON.parse(saved));
      }
    }
  }, []);

  // WebSocket подключение
  useEffect(() => {
    const ws = new WebSocket(SERVER_URL);
    setSocket(ws);

    ws.onopen = () => console.log('✅ WebSocket подключен');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'created':
          setRoomCode(data.roomCode);
          setPlayers(data.players);
          setMaxPlayers(data.maxPlayers);
          setIsHost(true);
          setAlivePlayers(data.players);
          setScreen('lobby');
          break;
        case 'joined':
          setRoomCode(data.roomCode);
          setPlayers(data.players);
          setMaxPlayers(data.maxPlayers);
          setAlivePlayers(data.players);
          setScreen('lobby');
          break;
        case 'playersUpdate':
          setPlayers(data.players);
          setAlivePlayers(data.players);
          break;
        case 'roleAssigned':
          setPlayerRole(data.role);
          break;
        case 'gameStarted':
          setGamePhase(data.phase);
          setScreen('game');
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
          break;
      }
    };
    return () => ws.close();
  }, []);

  // ===== ПОКУПКА ЗА ЗВЁЗДЫ =====
  const buyItem = (item: typeof shopItems[0]) => {
    if (!tg) return;
    if (ownedItems.includes(item.id)) {
      alert('✅ У тебя уже есть этот товар!');
      return;
    }
    tg.showPopup({
      title: 'Покупка',
      message: `Купить "${item.name}" за ${item.price} ⭐️?\n\n${item.desc}`,
      buttons: [
        { id: 'buy', type: 'default', text: 'Купить' },
        { id: 'cancel', type: 'cancel', text: 'Отмена' }
      ]
    }, (buttonId: string) => {
      if (buttonId === 'buy') {
        const newOwned = [...ownedItems, item.id];
        setOwnedItems(newOwned);
        localStorage.setItem('ownedItems', JSON.stringify(newOwned));
        setStarsBalance(prev => prev + item.price);
        alert(`✨ Ты купил "${item.name}"!`);
        tg.HapticFeedback?.notificationOccurred('success');
      }
    });
  };

  const createGame = () => {
    if (playerName && socket) {
      // Отправляем на сервер выбранное количество игроков
      socket.send(JSON.stringify({
        type: 'create',
        playerName,
        maxPlayers
      }));
    }
  };

  const joinGame = () => {
    if (inputCode && playerName && socket) {
      socket.send(JSON.stringify({
        type: 'join',
        roomCode: inputCode,
        playerName
      }));
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

  const sendVote = (target: string) => {
    if (socket && roomCode && playerName) {
      socket.send(JSON.stringify({
        type: 'vote',
        roomCode,
        playerName,
        target
      }));
    }
  };

  const shareGame = () => {
    if (roomCode) {
      const gameUrl = `https://t.me/share/url?url=${window.location.origin}&text=🎮 Сыграем в мафию? Код комнаты: ${roomCode}`;
      tg?.openTelegramLink(gameUrl);
    }
  };

  // ===== СТИЛИ =====
  const styles = {
    container: {
      padding: '20px',
      minHeight: '100vh',
      background: '#0b0e1a',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    },
    card: {
      maxWidth: '520px',
      margin: '0 auto',
      background: '#141a2b',
      borderRadius: '32px',
      padding: '32px 24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 2px rgba(95,125,255,0.3)'
    },
    title: {
      textAlign: 'center' as const,
      marginBottom: '24px',
      fontSize: '28px',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #5f7dff, #9d7aff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    mainButtons: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      gap: '12px',
      marginBottom: '20px'
    },
    createButton: {
      padding: '14px 24px',
      border: 'none',
      borderRadius: '50px',
      fontWeight: 600,
      fontSize: '16px',
      cursor: 'pointer',
      background: 'linear-gradient(135deg, #5f7dff, #9d7aff)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(95,125,255,0.4)',
      transition: 'all 0.2s'
    },
    joinMainButton: {
      padding: '14px 24px',
      border: '2px solid #5f7dff',
      borderRadius: '50px',
      fontWeight: 600,
      fontSize: '16px',
      cursor: 'pointer',
      background: 'transparent',
      color: '#5f7dff'
    },
    backButton: {
      padding: '10px 20px',
      background: 'transparent',
      color: '#a0b3d9',
      border: 'none',
      borderRadius: '30px',
      fontSize: '14px',
      cursor: 'pointer',
      marginTop: '16px'
    },
    input: {
      width: '100%',
      padding: '14px 18px',
      borderRadius: '50px',
      border: '2px solid rgba(255,255,255,0.1)',
      background: 'rgba(10,15,30,0.6)',
      color: 'white',
      fontSize: '16px',
      marginBottom: '16px',
      outline: 'none'
    },
    codeBox: {
      background: 'rgba(20,30,50,0.5)',
      padding: '20px',
      borderRadius: '30px',
      textAlign: 'center' as const,
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '24px',
      border: '2px solid rgba(95,125,255,0.3)',
      display: 'flex',
      justifyContent: 'center',
      gap: '10px'
    },
    shareButton: {
      padding: '5px 10px',
      background: 'transparent',
      border: 'none',
      fontSize: '28px',
      cursor: 'pointer',
      color: 'white'
    },
    playersBox: {
      marginBottom: '20px'
    },
    playerItem: {
      background: 'rgba(20,30,50,0.5)',
      padding: '12px 18px',
      marginBottom: '8px',
      borderRadius: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: '1px solid rgba(95,125,255,0.2)'
    },
    phaseBox: {
      background: 'rgba(95,125,255,0.2)',
      padding: '12px',
      borderRadius: '30px',
      marginBottom: '20px',
      textAlign: 'center' as const,
      fontWeight: 600,
      border: '2px solid #5f7dff'
    },
    roleBox: {
      background: 'rgba(20,30,50,0.5)',
      padding: '20px',
      borderRadius: '30px',
      marginBottom: '20px',
      textAlign: 'center' as const,
      fontSize: '20px'
    },
    actionButton: {
      padding: '10px 16px',
      margin: '4px',
      background: '#5f7dff',
      color: 'white',
      border: 'none',
      borderRadius: '30px',
      cursor: 'pointer',
      fontWeight: 600
    },
    shopSection: {
      marginTop: '30px',
      padding: '20px',
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '30px',
      maxHeight: '400px',
      overflowY: 'auto' as const
    },
    shopTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '15px',
      textAlign: 'center' as const,
      color: '#ffd966'
    },
    shopItem: {
      background: '#1a1a2e',
      padding: '12px',
      marginBottom: '10px',
      borderRadius: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: '1px solid rgba(255,215,0,0.3)'
    },
    shopItemInfo: { flex: 1 },
    shopItemName: { fontWeight: 'bold' },
    shopItemDesc: { fontSize: '12px', color: '#a0b3d9' },
    shopItemPrice: { color: '#ffd966', fontWeight: 'bold', marginRight: '10px' },
    shopButton: {
      padding: '8px 16px',
      background: 'rgba(255,215,0,0.2)',
      color: '#ffd966',
      border: '2px solid gold',
      borderRadius: '30px',
      cursor: 'pointer'
    },
    ownedBadge: {
      background: '#36c97a',
      color: 'white',
      padding: '4px 10px',
      borderRadius: '30px',
      fontSize: '12px'
    },
    categoryTitle: {
      fontSize: '18px',
      marginTop: '15px',
      marginBottom: '10px',
      color: '#5f7dff'
    },
    // Новые стили для выбора количества игроков
    playerCountSelector: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      marginBottom: '20px'
    },
    countButton: {
      padding: '10px 20px',
      borderRadius: '30px',
      border: '2px solid #5f7dff',
      background: 'transparent',
      color: '#5f7dff',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: '0.2s'
    },
    countButtonActive: {
      background: '#5f7dff',
      color: 'white',
      borderColor: '#5f7dff'
    }
  };

  // ===== ЭКРАН СОЗДАНИЯ ИГРЫ =====
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
          <div style={styles.playerCountSelector}>
            {[4, 6, 8].map(num => (
              <button
                key={num}
                onClick={() => setMaxPlayers(num)}
                style={{
                  ...styles.countButton,
                  ...(maxPlayers === num ? styles.countButtonActive : {})
                }}
              >
                {num}
              </button>
            ))}
          </div>
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

  // ===== ЭКРАН ВХОДА =====
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

  // ===== ЛОББИ =====
  if (screen === 'lobby') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🕵️ Лобби</h1>
          <div style={styles.codeBox}>
            {roomCode}
            <button onClick={shareGame} style={styles.shareButton}>🔗</button>
          </div>
          <div style={styles.playersBox}>
            <h3 style={{ marginBottom: '12px' }}>Игроки ({players.length}/{maxPlayers}):</h3>
            {players.map((p, i) => (
              <div key={i} style={styles.playerItem}>
                <span>{p}</span>
                {i === 0 && <span style={{ color: '#ffd966' }}>👑</span>}
              </div>
            ))}
          </div>
          {isHost && players.length === maxPlayers && (
            <button onClick={startGame} style={styles.createButton}>
              Начать игру 🚀
            </button>
          )}
          {isHost && players.length < maxPlayers && (
            <p style={{ textAlign: 'center', color: '#a0b3d9' }}>
              Ожидаем игроков... ({players.length}/{maxPlayers})
            </p>
          )}
        </div>
      </div>
    );
  }

  // ===== ИГРОВОЙ ЭКРАН =====
  if (screen === 'game') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.phaseBox}>
            {gamePhase === 'night' ? '🌙 Ночь' : gamePhase === 'day' ? '☀️ День' : '🗳️ Голосование'}
          </div>
          <div style={styles.roleBox}>
            Твоя роль: <strong>{playerRole}</strong>
          </div>
          {gamePhase === 'voting' && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>🗳️ Кого исключаем?</h3>
              {alivePlayers.filter(p => p !== playerName).map(p => (
                <button key={p} onClick={() => sendVote(p)} style={styles.actionButton}>
                  {p}
                </button>
              ))}
            </div>
          )}
          <div style={styles.playersBox}>
            <h3>Живы ({alivePlayers.length})</h3>
            {alivePlayers.map(p => (
              <div key={p} style={styles.playerItem}>{p}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== ГЛАВНЫЙ ЭКРАН =====
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

        {/* Магазин */}
        <div style={styles.shopSection}>
          <div style={styles.shopTitle}>⭐️ МАГАЗИН ⭐️</div>
          {['role', 'boost', 'skin'].map(cat => {
            const items = shopItems.filter(i => i.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <div style={styles.categoryTitle}>
                  {cat === 'role' ? '🎭 Роли' : cat === 'boost' ? '⚡ Бусты' : '🎨 Скины'}
                </div>
                {items.map(item => (
                  <div key={item.id} style={styles.shopItem}>
                    <div style={styles.shopItemInfo}>
                      <div style={styles.shopItemName}>{item.name}</div>
                      <div style={styles.shopItemDesc}>{item.desc}</div>
                    </div>
                    <span style={styles.shopItemPrice}>{item.price}⭐</span>
                    {ownedItems.includes(item.id) ? (
                      <span style={styles.ownedBadge}>✅</span>
                    ) : (
                      <button onClick={() => buyItem(item)} style={styles.shopButton}>
                        Купить
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
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
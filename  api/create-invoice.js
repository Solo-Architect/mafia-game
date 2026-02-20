export default async function handler(req, res) {
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { itemId, name, price, description } = req.body;
  
    // Уникальный ID для платежа
    const payload = `${itemId}_${Date.now()}`;
  
    // Для Telegram Stars (XTR) сумма должна быть в наименьших единицах
    // 1 звезда = 1 единица, поэтому оставляем как есть
    const amount = price;
  
    try {
      // Создаём инвойс через Telegram Bot API
      const response = await fetch(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/createInvoiceLink`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: name,
            description: description,
            payload: payload,
            currency: 'XTR', // Telegram Stars
            prices: [{ label: name, amount: amount }]
          })
        }
      );
  
      const data = await response.json();
  
      if (data.ok) {
        res.json({ invoiceLink: data.result });
      } else {
        console.error('❌ Telegram API error:', data);
        res.status(500).json({ 
          error: 'Failed to create invoice',
          details: data 
        });
      }
    } catch (error) {
      console.error('❌ Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';

const apiId = 34158723;
const apiHash = 'f8996a235b5f84fa191db9ac2323fd32';

const stringSession = new StringSession(
  '1AgAOMTQ5LjE1NC4xNjcuNDEBu6Kpe/7P9+eOuFZjZ5C6L7IEr+oG5gpSE5RU/FhQ8dmBoDvmeaESlhkJbpx9r2Ra46xB5SIB2ePCFUiMAUzj5AP1zVzu2mba661cDWYjv63q1VPh8ebxuJnMTFtku3U6p2G68EWGD80dtBY5xl9DD2VINB4FJ++WsBPR75fexqGsHrD+L8daVxRDPFlt1hWu5RqTMyQjYWC3qpA+3/LIt5g8Y+BVEyA4MPIH30TbNMRg73Ny9dJ1p00i1TMY7Yh+cyes9TJpPTXiAmRmG1rKBRFEdtGcxkYv8qPKUbLLnpUpOXiODIlfyNOoXqO7wGx94CXQz3w10KsmCPRp1lPHaqQ='
);

const LEADS_CHAT = -4999904961;

const keywordPatterns = [
  // esim/sim базовое
  /\be\s*-?\s*sim\b/i,
  /\besim\b/i,
  /\bесим\b/i,
  /\bсим(?:ка|ку|ки|ок|очный)?\b/i,
  /\bсим\s*-?\s*карт(?:а|ы|у|ой)\b/i,
  /\bsim\s*-?\s*card\b/i,

  // связь/интернет
  /\bсвяз[ьи]\b/i,
  /\bмоб(?:ильн(?:ый|ая|ого))?\s*связ[ьи]\b/i,
  /\bинтернет\b/i,
  /\bмоб(?:ильн(?:ый|ая|ого))?\s*интернет\b/i,
  /\bданные\b/i,
  /\bтрафик\b/i,
  /\bdata\b/i,
  /\bwi\s*-?\s*fi\b/i,
  /\bwifi\b/i,
  /\b4g\b/i,
  /\b5g\b/i,
  /\blte\b/i,
  /\b3g\b/i,

  // тарифы/пакеты
  /\bроуминг\b/i,
  /\bтариф(?:ы|а|у)?\b/i,
  /\bпакет(?:ы|а)?\b/i,
  /\bбезлимит(?:ный|а)?\b/i,
  /\bминут(?:ы|а)?\b/i,
  /\bсмс\b/i,
  /\bгб\b/i,
  /\bgb\b/i,
  /\bмб\b/i,
  /\bmb\b/i,
  /\bгигабайт(?:ов|а)?\b/i,

  // намерение купить/подключить
  /\bгде\s+(?:купить|взять|сделать|оформить|подключить).{0,40}(?:сим|есим|e\s*-?\s*sim)\b/i,
  /\bкак\s+(?:подключить|настроить|активировать).{0,40}(?:сим|есим|интернет|роуминг)\b/i,
  /\bкакую\s+(?:сим|симку|есим)\b/i,
  /\b(?:купить|взять|оформить|подключить).{0,20}(?:сим|есим|e\s*-?\s*sim)\b/i,

  // операторы
  /\bмтс\b/i,
  /\bбилайн\b/i,
  /\bмегафон\b/i,
  /\bтеле\s*2\b/i,
  /\btele\s*2\b/i,
  /\bbeeline\b/i,
  /\bairalo\b/i,
  /\bholafly\b/i,
  /\bnomad\b/i,
  /\byesim\b/i,
  /\bdrimsim\b/i,
  /\bubigi\b/i,

  // контекст по странам
  /\b(?:во|в)\s+(?:вьетнаме|таиланде|бали|индонезии|турции).{0,30}(?:связь|интернет|сим|есим)\b/i,
];

const keywordIncludes = [
  'есим', 'симка', 'симку', 'симки', 'сим карт', 'сим-карт',
  'связь', 'интернет', 'мобильный интернет', 'роуминг',
  'тариф', 'тарифы', 'пакет', 'безлимит', 'гб', 'мб',
  'где купить сим', 'где взять сим', 'какую сим', 'как подключить esim',
];

function isLead(text = '') {
  const t = text.toLowerCase();
  if (keywordIncludes.some((k) => t.includes(k))) return true;
  return keywordPatterns.some((rx) => rx.test(t));
}

function messageLink(chat, messageId) {
  if (!chat || !messageId) return 'недоступно';
  if (chat.username) return `https://t.me/${chat.username}/${messageId}`;

  // для приватных супергрупп: https://t.me/c/<id_without_-100>/<msg_id>
  const rawId = String(chat.id ?? '').replace('-', '');
  const shortId = rawId.startsWith('100') ? rawId.slice(3) : rawId;
  if (shortId) return `https://t.me/c/${shortId}/${messageId}`;
  return 'недоступно';
}

const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

async function start() {
  console.log('Starting Telegram leads monitor...');
  await client.connect();
  console.log('✅ Connected');

  client.addEventHandler(async (event) => {
    try {
      const msg = event.message;
      const text = msg?.message?.trim();
      if (!text) return;

      const chat = await msg.getChat();
      const chatNameDebug = chat?.title || chat?.username || 'ЛС/неизвестный чат';
      console.log(`[DEBUG] new msg chat="${chatNameDebug}" out=${Boolean(msg.out)} text="${text.slice(0,120)}"`);

      if (!isLead(text.toLowerCase())) return;

      const sender = await msg.getSender();

      const chatName = chat?.title || chat?.username || 'ЛС/неизвестный чат';
      const senderName = sender?.username
        ? `@${sender.username}`
        : [sender?.firstName, sender?.lastName].filter(Boolean).join(' ') || 'unknown';

      const when = new Date(msg.date * 1000).toLocaleString('ru-RU', { timeZone: 'Asia/Ho_Chi_Minh' });
      const link = messageLink(chat, msg.id);

      const out = [
        '🔔 Лид найден!',
        `📍 Чат: ${chatName}`,
        `👤 От: ${senderName}`,
        `💬 «${text.slice(0, 700)}${text.length > 700 ? '…' : ''}»`,
        `🔗 ${link}`,
        `⏰ ${when}`,
      ].join('\n');

      await client.sendMessage(LEADS_CHAT, { message: out });
      console.log('Lead forwarded:', chatName);
    } catch (e) {
      console.error('Handler error:', e?.message || e);
    }
  }, new NewMessage({ incoming: true, outgoing: true }));
}

start().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

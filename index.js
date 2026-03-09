import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage } from 'telegram/events/index.js'
import input from 'input'

const apiId = 34158723
const apiHash = 'f8996a235b5f84fa191db9ac2323fd32'
const phone = '+375257151409'

// 👉 сюда потом вставишь сохранённую сессию
const stringSession = new StringSession('')

const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 })

async function start() {
  console.log('Starting Telegram monitor...')

  await client.start({
    phoneNumber: async () => phone,
    phoneCode: async () => {
      return await input.text('Введите код из Telegram: ')
    },
    onError: err => console.log(err),
  })

  console.log('✅ Logged in')
  console.log('SAVE THIS SESSION:')
  console.log(client.session.save())

  const keywords = ['esim', 'симка', 'сим', 'связь', 'интернет']

  client.addEventHandler(async event => {
    const text = event.message?.message?.toLowerCase()
    if (!text) return

    if (keywords.some(k => text.includes(k))) {
      console.log('🔔 FOUND:', text)

      await client.sendMessage('me', {
        message: `🔔 Найдено сообщение:\n\n${text}`,
      })
    }
  }, new NewMessage({}))
}

start()

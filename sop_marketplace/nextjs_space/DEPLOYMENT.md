# 🚀 Руководство по развертыванию

## Предварительная подготовка

### 1. Проверка кода перед production

```bash
# Удалить автологин
# Файл: app/auth/signin/page.tsx
# Удалить useEffect с автологином для m@ivdgroup.eu
```

### 2. Переменные окружения

Создайте `.env.production` со всеми необходимыми переменными:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com"

# Stripe (Production keys!)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AWS S3
AWS_BUCKET_NAME="your-production-bucket"
AWS_FOLDER_PREFIX="production/"

# Abacus.AI
ABACUSAI_API_KEY="your-api-key"

# Email (Production SMTP)
EMAIL_SERVER="smtp://user:password@smtp.example.com:587"
EMAIL_FROM="noreply@yourdomain.com"
```

### 3. База данных

```bash
# Создать production базу данных
createdb sop_marketplace_production

# Применить миграции
yarn prisma db push

# НЕ запускать seed в production!
```

### 4. Stripe Webhook

1. Перейдите в Stripe Dashboard → Webhooks
2. Добавьте endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Выберите события:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. Скопируйте webhook secret в `.env`

### 5. AWS S3

1. Создайте production bucket
2. Настройте CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

## Развертывание

### Вариант 1: Vercel (Рекомендуется)

```bash
# Установить Vercel CLI
npm i -g vercel

# Развернуть
vercel --prod

# Настроить переменные окружения в Vercel Dashboard
```

### Вариант 2: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
```

```bash
# Собрать образ
docker build -t sop-marketplace .

# Запустить контейнер
docker run -p 3000:3000 --env-file .env.production sop-marketplace
```

### Вариант 3: VPS (Ubuntu)

```bash
# Установить зависимости
sudo apt update
sudo apt install nodejs npm postgresql nginx

# Клонировать проект
git clone <your-repo>
cd sop-marketplace/nextjs_space

# Установить зависимости
yarn install

# Собрать проект
yarn build

# Запустить с PM2
npm install -g pm2
pm2 start yarn --name "sop-marketplace" -- start
pm2 save
pm2 startup
```

#### Настройка Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## После развертывания

### 1. Проверка здоровья приложения

```bash
# Проверить главную страницу
curl https://yourdomain.com

# Проверить API
curl https://yourdomain.com/api/auth/providers

# Проверить базу данных
yarn prisma studio
```

### 2. Мониторинг

Настройте мониторинг:
- **Sentry** для отслеживания ошибок
- **Vercel Analytics** для метрик производительности
- **Stripe Dashboard** для платежей
- **AWS CloudWatch** для S3

### 3. Резервное копирование

```bash
# Ежедневный backup базы данных
pg_dump sop_marketplace_production > backup_$(date +%Y%m%d).sql

# S3 versioning включить в AWS Console
```

### 4. SSL сертификат

```bash
# С Let's Encrypt (для Nginx)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Производительность

### Кэширование

Добавьте в `next.config.js`:

```javascript
module.exports = {
  images: {
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizeCss: true,
  },
}
```

### CDN

Используйте CDN для статических ресурсов:
- Vercel автоматически использует Edge Network
- Для других платформ: Cloudflare, AWS CloudFront

## Безопасность

### 1. Rate Limiting

Добавьте в API routes:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // лимит запросов
});
```

### 2. CORS

Настройте CORS в `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
        ],
      },
    ]
  },
}
```

### 3. Секреты

- Никогда не коммитьте `.env` файлы
- Используйте secrets management (AWS Secrets Manager, Vault)
- Регулярно меняйте NEXTAUTH_SECRET

## Масштабирование

### Горизонтальное

```bash
# PM2 с кластером
pm2 start yarn --name "sop-marketplace" -i max -- start
```

### Вертикальное

- Увеличьте размер инстанса
- Настройте connection pooling для PostgreSQL
- Используйте Redis для сессий

## Checklist перед запуском

- [ ] Удален автологин
- [ ] Настроены production переменные окружения
- [ ] Stripe webhook настроен и работает
- [ ] Email сервер настроен
- [ ] S3 bucket создан и настроен
- [ ] База данных мигрирована
- [ ] SSL сертификат установлен
- [ ] Мониторинг настроен
- [ ] Backup настроен
- [ ] Rate limiting включен
- [ ] Протестированы все критические функции

## Troubleshooting

### Ошибка "Module not found"
```bash
yarn install
yarn build
```

### Ошибка подключения к БД
- Проверьте DATABASE_URL
- Убедитесь, что PostgreSQL запущен
- Проверьте firewall правила

### Stripe webhook не работает
- Проверьте STRIPE_WEBHOOK_SECRET
- Убедитесь, что URL доступен публично
- Проверьте логи webhook в Stripe Dashboard

### Проблемы с S3
- Проверьте IAM права
- Убедитесь, что bucket существует
- Проверьте CORS настройки

## Поддержка

Для вопросов и помощи:
- Email: support@example.com
- Documentation: https://yourdomain.com/docs
- GitHub Issues: <your-repo>/issues

---

**Последнее обновление**: 22.11.2025
**Версия**: 2.0.0

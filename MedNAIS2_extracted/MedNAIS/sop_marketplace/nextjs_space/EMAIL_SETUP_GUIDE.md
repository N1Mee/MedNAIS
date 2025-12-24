# Email Provider Setup Guide

## Обзор

Для работы Magic Links authentication необходимо настроить SMTP провайдера для отправки email. Это руководство покрывает настройку самых популярных провайдеров.

---

## Рекомендуемые Провайдеры

### 1. Resend (Рекомендуется для Production)

**Почему Resend:**
- ✅ Современный API, специально для разработчиков
- ✅ Высокая доставляемость
- ✅ Простая интеграция
- ✅ Бесплатный tier: 3,000 emails/месяц
- ✅ Детальная аналитика

**Настройка:**

1. **Регистрация:**
   - Перейдите на https://resend.com
   - Создайте аккаунт

2. **Получите API Key:**
   - Dashboard → API Keys → Create API Key
   - Скопируйте ключ (показывается только один раз)

3. **Настройте домен (опционально, но рекомендуется):**
   - Dashboard → Domains → Add Domain
   - Добавьте ваш домен (например, `yourdomain.com`)
   - Добавьте DNS записи, указанные Resend
   - Дождитесь верификации

4. **Environment Variables:**
```env
# Resend Configuration
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_ваш_api_key_здесь
EMAIL_FROM=noreply@yourdomain.com
```

**Примечания:**
- Используйте порт 465 для SSL или 587 для TLS
- `EMAIL_SERVER_USER` всегда `resend`
- `EMAIL_SERVER_PASSWORD` - это ваш API key
- `EMAIL_FROM` должен быть с верифицированного домена

---

### 2. SendGrid (Популярный выбор)

**Почему SendGrid:**
- ✅ Надежный сервис от Twilio
- ✅ Бесплатный tier: 100 emails/день
- ✅ Расширенная аналитика
- ✅ Глобальная инфраструктура

**Настройка:**

1. **Регистрация:**
   - Перейдите на https://sendgrid.com
   - Создайте бесплатный аккаунт

2. **Создайте API Key:**
   - Settings → API Keys → Create API Key
   - Выберите "Restricted Access" или "Full Access"
   - Скопируйте ключ

3. **Верифицируйте отправителя:**
   - Settings → Sender Authentication → Single Sender Verification
   - Добавьте и верифицируйте email адрес
   - Или настройте Domain Authentication (рекомендуется для production)

4. **Environment Variables:**
```env
# SendGrid Configuration
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=SG.ваш_api_key_здесь
EMAIL_FROM=noreply@yourdomain.com
```

**Примечания:**
- `EMAIL_SERVER_USER` всегда `apikey` (буквально это слово)
- `EMAIL_SERVER_PASSWORD` - это ваш SendGrid API key
- Email адрес должен быть верифицирован в SendGrid

---

### 3. AWS SES (Amazon Simple Email Service)

**Почему AWS SES:**
- ✅ Самый дешевый вариант для больших объемов
- ✅ $0.10 за 1,000 emails
- ✅ Высокая масштабируемость
- ✅ Интеграция с AWS экосистемой

**Настройка:**

1. **AWS Console:**
   - Перейдите в AWS SES Console
   - Выберите регион (рекомендуется близкий к вашим пользователям)

2. **Верификация:**
   - Verified identities → Create identity
   - Выберите Domain или Email
   - Для домена: добавьте DNS записи
   - Для email: подтвердите через письмо

3. **Создайте SMTP Credentials:**
   - SMTP Settings → Create SMTP Credentials
   - Сохраните Username и Password

4. **Выйдите из Sandbox Mode:**
   - Account dashboard → Request production access
   - Заполните форму (необходимо для production)

5. **Environment Variables:**
```env
# AWS SES Configuration
EMAIL_SERVER_HOST=email-smtp.us-east-1.amazonaws.com  # Замените регион
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=ваш_smtp_username
EMAIL_SERVER_PASSWORD=ваш_smtp_password
EMAIL_FROM=noreply@yourdomain.com
```

**Регионы SMTP endpoints:**
- US East (N. Virginia): `email-smtp.us-east-1.amazonaws.com`
- US West (Oregon): `email-smtp.us-west-2.amazonaws.com`
- EU (Ireland): `email-smtp.eu-west-1.amazonaws.com`
- Asia Pacific (Sydney): `email-smtp.ap-southeast-2.amazonaws.com`

**Важно:**
- Sandbox mode ограничен верифицированными адресами
- Production access обычно одобряется за 24 часа
- Настройте SPF/DKIM/DMARC для лучшей доставляемости

---

### 4. Gmail SMTP (Только для Development)

**⚠️ НЕ рекомендуется для production!**

**Почему НЕ production:**
- ❌ Лимит: 100-500 emails/день
- ❌ Может блокироваться как спам
- ❌ Не подходит для автоматизированных систем

**Настройка (только для testing):**

1. **Включите 2-Step Verification:**
   - Google Account → Security → 2-Step Verification

2. **Создайте App Password:**
   - Google Account → Security → App Passwords
   - Выберите "Mail" и ваше устройство
   - Скопируйте 16-символьный пароль

3. **Environment Variables:**
```env
# Gmail Configuration (Development Only)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your.email@gmail.com
EMAIL_SERVER_PASSWORD=ваш_app_password_без_пробелов
EMAIL_FROM=your.email@gmail.com
```

---

### 5. Mailgun

**Почему Mailgun:**
- ✅ Мощный API
- ✅ Бесплатный tier: 5,000 emails/месяц (первые 3 месяца)
- ✅ Хорошая доставляемость
- ✅ Email validation API

**Настройка:**

1. **Регистрация:**
   - https://mailgun.com
   - Создайте аккаунт

2. **Добавьте домен:**
   - Sending → Domains → Add New Domain
   - Следуйте инструкциям по настройке DNS

3. **Получите SMTP Credentials:**
   - Domain Settings → SMTP Credentials → Reset Password
   - Или создайте нового SMTP пользователя

4. **Environment Variables:**
```env
# Mailgun Configuration
EMAIL_SERVER_HOST=smtp.mailgun.org
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=postmaster@your-domain.mailgun.org
EMAIL_SERVER_PASSWORD=ваш_smtp_password
EMAIL_FROM=noreply@your-domain.mailgun.org
```

---

## Тестирование Email Настройки

### 1. Проверка через приложение:

```bash
# Запустите приложение
cd /home/ubuntu/sop_marketplace/nextjs_space
yarn dev

# Перейдите на http://localhost:3000/auth/signin
# Введите ваш email и нажмите "Send Magic Link"
# Проверьте консоль сервера на наличие ошибок
```

### 2. Проверка SMTP подключения (Node.js script):

Создайте `test-email.js`:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:', error);
  } else {
    console.log('✅ SMTP Connection Successful!');
  }
});

transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: 'your-test-email@example.com',
  subject: 'Test Email',
  text: 'This is a test email from SOP Marketplace',
}, (error, info) => {
  if (error) {
    console.error('❌ Send Failed:', error);
  } else {
    console.log('✅ Email Sent:', info.messageId);
  }
});
```

Запустите:
```bash
node test-email.js
```

---

## Улучшение Доставляемости

### SPF Record
Добавьте в DNS вашего домена:
```
TXT @ "v=spf1 include:_spf.your-provider.com ~all"
```

Примеры:
- Resend: `include:_spf.resend.com`
- SendGrid: `include:sendgrid.net`
- Mailgun: `include:mailgun.org`
- AWS SES: `include:amazonses.com`

### DKIM
- Настраивается через ваш email провайдер
- Следуйте инструкциям провайдера для добавления DKIM записей

### DMARC
Добавьте в DNS:
```
TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

---

## Troubleshooting

### Email не доходит

1. **Проверьте spam папку**

2. **Проверьте SMTP credentials:**
```bash
# В консоли приложения должен быть вывод magic link
echo "Check server logs for magic link output"
```

3. **Проверьте Email Provider Dashboard:**
   - Resend: Dashboard → Logs
   - SendGrid: Activity → Email Activity
   - AWS SES: Sending Statistics

4. **Общие проблемы:**

**Authentication Failed:**
```
Error: Invalid login: 535 Authentication failed
```
**Решение:**
- Проверьте `EMAIL_SERVER_USER` и `EMAIL_SERVER_PASSWORD`
- Для SendGrid: user должен быть `apikey`
- Для Resend: user должен быть `resend`

**Connection Timeout:**
```
Error: Connection timeout
```
**Решение:**
- Проверьте `EMAIL_SERVER_HOST` и `EMAIL_SERVER_PORT`
- Проверьте firewall/security группы
- Попробуйте другой порт (587 или 465)

**From Address Not Verified:**
```
Error: Sender identity not verified
```
**Решение:**
- Верифицируйте домен или email в панели провайдера
- Убедитесь, что `EMAIL_FROM` соответствует верифицированному адресу

---

## Рекомендации для Production

### ✅ Do's

1. **Используйте собственный домен**
   - Не `@gmail.com` или `@yahoo.com`
   - Желательно поддомен: `mail.yourdomain.com`

2. **Настройте DNS записи**
   - SPF, DKIM, DMARC
   - Это критично для доставляемости

3. **Мониторьте метрики**
   - Bounce rate
   - Complaint rate
   - Delivery rate

4. **Используйте транзакционный email провайдер**
   - Resend, SendGrid, AWS SES, Mailgun
   - НЕ Gmail, Outlook, Yahoo

5. **Храните credentials безопасно**
   - Используйте `.env` файл
   - Добавьте `.env` в `.gitignore`
   - Используйте secrets management в production

### ❌ Don'ts

1. **Не используйте личные email аккаунты**
2. **Не храните credentials в коде**
3. **Не игнорируйте DNS настройки**
4. **Не отправляйте массовые emails без прогрева**
5. **Не забывайте про unsubscribe ссылки (для маркетинговых email)**

---

## Сравнение Провайдеров

| Провайдер | Бесплатный Tier | Цена (Production) | Доставляемость | Простота | Рекомендация |
|-----------|----------------|-------------------|---------------|----------|-------------|
| **Resend** | 3,000/месяц | $20/100k | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Лучший для новых проектов** |
| **SendGrid** | 100/день | $19.95/50k | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Отлично для средних проектов |
| **AWS SES** | - | $0.10/1k | ⭐⭐⭐⭐ | ⭐⭐⭐ | Лучший для больших объемов |
| **Mailgun** | 5,000/3мес | $35/50k | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Хорош для API-first подхода |
| **Gmail** | 100-500/день | - | ⭐⭐ | ⭐⭐⭐⭐⭐ | **Только development** |

---

## Следующие Шаги

1. ✅ Выберите провайдера
2. ✅ Настройте аккаунт
3. ✅ Добавьте environment variables
4. ✅ Протестируйте отправку
5. ✅ Настройте DNS записи
6. ✅ Мониторьте доставляемость

---

## Поддержка

Если у вас проблемы с настройкой email:

1. Проверьте logs приложения
2. Проверьте dashboard email провайдера
3. Проверьте этот guide еще раз
4. Обратитесь в support вашего email провайдера

---

**Документ обновлен:** 26 ноября 2025  
**Версия:** 1.0  
**Статус:** ✅ Production Ready

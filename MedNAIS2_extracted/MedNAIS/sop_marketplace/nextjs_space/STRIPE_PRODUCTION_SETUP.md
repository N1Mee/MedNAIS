# Stripe Production Setup Guide

## Обзор

Это руководство описывает процесс перехода Stripe интеграции из тестового режима в production режим для обработки реальных платежей.

---

## Предварительные Требования

### 1. Stripe Account

✅ **Что вам нужно:**
- Верифицированный Stripe аккаунт
- Подключенный банковский счет для выплат
- Заполненная информация о компании

**Шаги:**

1. **Зарегистрируйтесь на Stripe:**
   - https://dashboard.stripe.com/register
   - Выберите страну и тип бизнеса

2. **Активируйте аккаунт:**
   - Complete business details
   - Verify identity (может потребоваться документы)
   - Add bank account для выплат

3. **Enable payment methods:**
   - Dashboard → Settings → Payment methods
   - Включите Cards, ACH, и другие нужные методы

---

## Настройка Production Keys

### Текущие Test Keys (Удалите в production)

```env
# ❌ Test Mode - Только для development
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Production Keys

**Получение ключей:**

1. **Переключитесь на Live mode:**
   - В Stripe Dashboard переключите toggle с "Test mode" на "Live mode"
   - Находится в правом верхнем углу

2. **Publishable Key:**
   - Dashboard → Developers → API keys
   - Скопируйте "Publishable key" (начинается с `pk_live_`)

3. **Secret Key:**
   - На той же странице
   - Скопируйте "Secret key" (начинается с `sk_live_`)
   - ⚠️ **НИКОГДА не делитесь этим ключом!**

4. **Environment Variables:**
```env
# ✅ Production Mode
STRIPE_PUBLISHABLE_KEY=pk_live_ваш_publishable_key
STRIPE_SECRET_KEY=sk_live_ваш_secret_key
STRIPE_WEBHOOK_SECRET=whsec_ваш_webhook_secret  # Настроим позже
```

---

## Настройка Webhook Endpoint

### Почему это важно?

Webhooks позволяют Stripe уведомлять ваше приложение о событиях платежей асинхронно:
- ✅ Подтверждение успешной оплаты
- ✅ Обработка неудачных платежей
- ✅ Возвраты средств
- ✅ Dispute handling

### Настройка Production Webhook

#### Шаг 1: Определите Webhook URL

Ваш webhook endpoint:
```
https://ваш-домен.com/api/webhooks/stripe
```

Примеры:
- Production: `https://mednais2.abacusai.app/api/webhooks/stripe`
- Custom domain: `https://yourdomain.com/api/webhooks/stripe`

#### Шаг 2: Добавьте Webhook в Stripe Dashboard

1. **Откройте Webhooks:**
   - Dashboard → Developers → Webhooks
   - Убедитесь, что вы в "Live mode"

2. **Add endpoint:**
   - Нажмите "Add endpoint"
   - Endpoint URL: `https://ваш-домен.com/api/webhooks/stripe`
   - Description: "SOP Marketplace Production Webhook"

3. **Select events to listen to:**
   
   Выберите следующие события:
   ```
   ✅ checkout.session.completed
   ✅ payment_intent.payment_failed
   ✅ payment_intent.succeeded (опционально, для дополнительной проверки)
   ```

   **Почему эти события:**
   - `checkout.session.completed`: Основное событие для завершения покупки
   - `payment_intent.payment_failed`: Обработка неудачных платежей

4. **Add endpoint:**
   - Нажмите "Add endpoint"

#### Шаг 3: Получите Signing Secret

1. После создания endpoint:
   - Нажмите на созданный webhook
   - Найдите "Signing secret"
   - Нажмите "Reveal"
   - Скопируйте значение (начинается с `whsec_`)

2. **Добавьте в .env:**
```env
STRIPE_WEBHOOK_SECRET=whsec_ваш_signing_secret
```

---

## Тестирование Webhook

### Локальное Тестирование (Stripe CLI)

**Установка Stripe CLI:**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget -qO- https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz | tar xz
sudo mv stripe /usr/local/bin/

# Windows
scoop install stripe
```

**Использование:**

```bash
# Войдите в Stripe
stripe login

# Запустите webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Это выведет временный webhook secret, добавьте его в .env для тестирования
# Ready! You are using Stripe API Version [2025-11-17]. Your webhook signing secret is whsec_...

# В другом терминале запустите приложение
yarn dev

# Теперь протестируйте платеж
```

**Trigger test events:**

```bash
# Симулируйте успешный checkout
stripe trigger checkout.session.completed

# Симулируйте неудачный платеж
stripe trigger payment_intent.payment_failed
```

### Production Webhook Testing

1. **Сделайте тестовый платеж:**
   - Используйте реальную карту с маленькой суммой ($0.50)
   - Или используйте test mode с test card

2. **Проверьте Webhook logs:**
   - Stripe Dashboard → Developers → Webhooks → [Ваш endpoint]
   - Во вкладке "Events" увидите все попытки
   - Проверьте Response status (должен быть 200)

3. **Проверьте Application logs:**
   - Ваше приложение должно логировать webhook события
   - Проверьте, что Purchase records обновляются корректно

---

## Код Integration Points

### Current Webhook Handler

**Файл:** `app/api/webhooks/stripe/route.ts`

Текущая реализация обрабатывает:

```typescript
export async function POST(request: NextRequest) {
  // 1. Verify webhook signature
  const signature = headers().get('stripe-signature');
  const event = stripe.webhooks.constructEvent(
    body,
    signature!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  // 2. Handle events
  switch (event.type) {
    case 'checkout.session.completed':
      // Update Purchase to 'completed'
      // Create Revenue record
      // Increment PromoCode usedCount
      break;
      
    case 'payment_intent.payment_failed':
      // Update Purchase to 'failed'
      break;
  }

  return NextResponse.json({ received: true });
}
```

### Важно для Production

**✅ Уже реализовано:**
- Webhook signature verification
- Idempotency (Stripe автоматически не дублирует)
- Error handling
- Transaction updates

**⚠️ Проверьте:**
- Логирование всех webhook событий
- Retry logic (Stripe повторяет до 3 дней)
- Timeout handling (Stripe ждет 30 секунд)

---

## Stripe Checkout Configuration

### Current Implementation

**Файл:** `app/api/checkout/create-session/route.ts`

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [...],
  mode: 'payment',
  success_url: `${process.env.NEXTAUTH_URL}/cart?success=true`,
  cancel_url: `${process.env.NEXTAUTH_URL}/cart?canceled=true`,
  metadata: {
    purchaseIds: '...',
    sopIds: '...',
  },
});
```

### Production Настройки

**URL Configuration:**

Убедитесь, что `NEXTAUTH_URL` правильно настроен:

```env
# .env.production
NEXTAUTH_URL=https://ваш-production-домен.com
```

Это важно для правильных redirect URL после оплаты.

**Дополнительные Опции (рекомендуется):**

```typescript
// Добавьте в create-session/route.ts

const session = await stripe.checkout.sessions.create({
  // ... existing config ...
  
  // Добавьте billing address collection
  billing_address_collection: 'required',
  
  // Добавьте customer email
  customer_email: user.email,
  
  // Добавьте shipping (если нужно)
  // shipping_address_collection: {
  //   allowed_countries: ['US', 'CA'],
  // },
  
  // Настройте payment intent
  payment_intent_data: {
    description: 'SOP Purchase',
    metadata: {
      userId: user.id,
    },
  },
  
  // Добавьте локализацию
  locale: 'auto', // или 'en', 'ru', etc.
});
```

---

## Revenue Split Configuration

### Current Logic

**Файл:** `lib/stripe.ts`

```typescript
export const PLATFORM_FEE_PERCENT = 0.30; // 30%
export const SELLER_REVENUE_PERCENT = 0.70; // 70%

export function calculateRevenueSplit(totalAmount: number) {
  const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT * 100) / 100;
  const sellerRevenue = Math.round(totalAmount * SELLER_REVENUE_PERCENT * 100) / 100;
  
  return {
    totalAmount,
    platformFee,
    sellerRevenue,
  };
}
```

### Production Considerations

**Stripe Fees:**
Stripe берет комиссию с каждого платежа:
- Cards: 2.9% + $0.30
- ACH: 0.8% (max $5)

**Ваши опции:**

1. **Включить Stripe fees в ваш platform fee:**
   ```typescript
   // Покрываете Stripe fees из своих 30%
   const PLATFORM_FEE_PERCENT = 0.30;
   const STRIPE_FEE_PERCENT = 0.029;
   const STRIPE_FEE_FIXED = 0.30;
   
   const stripeFee = (totalAmount * STRIPE_FEE_PERCENT) + STRIPE_FEE_FIXED;
   const netAmount = totalAmount - stripeFee;
   const yourPlatformFee = netAmount * (PLATFORM_FEE_PERCENT - STRIPE_FEE_PERCENT);
   const sellerRevenue = netAmount - yourPlatformFee;
   ```

2. **Добавить Stripe fees сверху:**
   ```typescript
   // Покупатель платит Stripe fees
   const stripeProcessingFee = calculateStripeFee(baseAmount);
   const totalAmount = baseAmount + stripeProcessingFee;
   ```

**Рекомендация:**
Используйте текущую простую модель (30/70), Stripe fees покрываются из вашей доли.

---

## Stripe Connect (Для direct payouts)

### ⚠️ Опционально - Advanced Feature

Если вы хотите напрямую выплачивать продавцам через Stripe:

**Преимущества:**
- ✅ Автоматические выплаты продавцам
- ✅ Меньше ручной работы
- ✅ Sellers могут видеть свою статистику

**Недостатки:**
- ❌ Более сложная настройка
- ❌ Дополнительные fees
- ❌ Требует onboarding продавцов

**Не реализовано в текущей версии.**

Если интересует, см. [Stripe Connect Documentation](https://stripe.com/docs/connect).

---

## Testing Checklist

### ✅ Pre-Production Tests

**В Test Mode:**

1. **Single SOP Purchase:**
   ```
   - [ ] Успешный платеж
   - [ ] Webhook получен
   - [ ] Purchase status = 'completed'
   - [ ] Revenue record создан
   - [ ] User может скачать SOP
   ```

2. **Cart Purchase (Multiple SOPs):**
   ```
   - [ ] Несколько SOPs в корзине
   - [ ] Правильная общая сумма
   - [ ] Все Purchase records созданы
   - [ ] Все Revenue records созданы
   ```

3. **Promo Code:**
   ```
   - [ ] Применение promo code
   - [ ] Правильный discount
   - [ ] usedCount увеличивается
   ```

4. **Failed Payment:**
   ```
   - [ ] Неудачный платеж (test card: 4000 0000 0000 9995)
   - [ ] Webhook получен
   - [ ] Purchase status = 'failed'
   - [ ] User получает сообщение об ошибке
   ```

5. **Free SOPs:**
   ```
   - [ ] Бесплатные SOPs не требуют оплаты
   - [ ] Доступ предоставляется сразу
   ```

**Test Cards:**
```
✅ Успешный: 4242 4242 4242 4242
❌ Declined: 4000 0000 0000 9995
❌ Insufficient funds: 4000 0000 0000 9995
🔄 3D Secure: 4000 0025 0000 3155
```

CVV: любой 3-значный  
Expiry: любая будущая дата  
ZIP: любой 5-значный

### ✅ Production Smoke Test

**После deployment:**

1. **Small Real Payment:**
   ```
   - [ ] Сделайте покупку на $0.50
   - [ ] Используйте реальную карту
   - [ ] Проверьте весь flow
   - [ ] Проверьте webhook logs в Stripe
   - [ ] Проверьте database records
   ```

2. **Refund Test:**
   ```
   - [ ] В Stripe Dashboard сделайте refund
   - [ ] Проверьте, что система корректно обрабатывает
   ```

---

## Monitoring & Analytics

### Stripe Dashboard

**Что мониторить:**

1. **Payments:**
   - Dashboard → Payments
   - Проверяйте успешные/неудачные платежи
   - Следите за unusual patterns

2. **Disputes:**
   - Dashboard → Disputes
   - Chargebacks и claims
   - Respond promptly (7-21 дней)

3. **Radar (Fraud Detection):**
   - Dashboard → Radar
   - Machine learning fraud detection
   - Настройте rules при необходимости

### Application Monitoring

**Логируйте важные события:**

```typescript
// В webhook handler
console.log('[STRIPE WEBHOOK]', {
  type: event.type,
  timestamp: new Date().toISOString(),
  purchaseIds: session.metadata.purchaseIds,
  amount: session.amount_total,
});
```

**Алерты:**
- Webhook failures (status != 200)
- Высокий процент declined payments
- Unusual refund activity

---

## Security Best Practices

### ✅ Do's

1. **Verify Webhook Signatures:**
   ```typescript
   // ✅ Уже реализовано
   const event = stripe.webhooks.constructEvent(
     body,
     signature,
     webhookSecret
   );
   ```

2. **Use HTTPS:**
   - Webhook URLs must be HTTPS
   - Let's Encrypt for free SSL

3. **Secure API Keys:**
   ```env
   # ✅ Храните в .env, не в коде
   STRIPE_SECRET_KEY=sk_live_...
   ```

4. **Validate Amounts:**
   ```typescript
   // ✅ Уже реализовано
   // Проверяем, что SOP существует и цена корректна
   ```

5. **Rate Limiting:**
   ```typescript
   // ✅ Уже реализовано в middleware.ts
   // Checkout endpoints имеют rate limiting
   ```

### ❌ Don'ts

1. **Не используйте Test keys в Production**
2. **Не храните API keys в git**
3. **Не игнорируйте webhook signature verification**
4. **Не делайте critical operations sync с checkout**
5. **Не храните полные card details (PCI-DSS)**

---

## Production Deployment Checklist

### Environment Variables

```env
# ✅ Production Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_ваш_key
STRIPE_SECRET_KEY=sk_live_ваш_key
STRIPE_WEBHOOK_SECRET=whsec_ваш_secret
NEXTAUTH_URL=https://ваш-домен.com
```

### Pre-Deployment

- [ ] Переключитесь на Live mode в Stripe
- [ ] Скопируйте Production API keys
- [ ] Настройте Production webhook endpoint
- [ ] Получите webhook signing secret
- [ ] Обновите environment variables
- [ ] Протестируйте в staging environment
- [ ] Убедитесь, что NEXTAUTH_URL правильный
- [ ] Проверьте SSL certificate

### Post-Deployment

- [ ] Сделайте test purchase с реальной картой ($0.50)
- [ ] Проверьте webhook delivery в Stripe Dashboard
- [ ] Проверьте Purchase и Revenue records в database
- [ ] Проверьте user access к купленным SOPs
- [ ] Настройте мониторинг и алерты
- [ ] Сделайте test refund
- [ ] Документируйте process для команды

### Legal & Compliance

- [ ] Privacy Policy упоминает Stripe
- [ ] Terms of Service включают payment terms
- [ ] Refund policy четко описана
- [ ] Contact information для support

---

## Troubleshooting

### Webhook не работает

**Симптомы:**
- Платежи успешны, но Purchase не обновляется
- Webhook показывает errors в Stripe Dashboard

**Решение:**

1. **Проверьте endpoint URL:**
   ```bash
   curl -X POST https://ваш-домен.com/api/webhooks/stripe
   # Должен вернуть 405 Method Not Allowed (без signature)
   ```

2. **Проверьте logs:**
   ```bash
   # В production deployment
   # Проверьте application logs на webhook requests
   ```

3. **Проверьте STRIPE_WEBHOOK_SECRET:**
   ```bash
   # Убедитесь, что secret правильный
   echo $STRIPE_WEBHOOK_SECRET
   ```

4. **Stripe Dashboard → Webhooks → [Endpoint] → Events:**
   - Проверьте Response body и status code
   - Если 401/403: проблема с signature verification
   - Если 500: server error, проверьте application logs

### Платежи Declined

**Причины:**
- Insufficient funds
- Card expired
- Incorrect CVV/ZIP
- Risk/fraud detection

**Действия:**
- Проверьте Radar dashboard для fraud patterns
- Убедитесь, что правильно передаете customer email
- Настройте 3D Secure при необходимости

### Webhook Signature Verification Failed

```
Error: No signatures found matching the expected signature
```

**Решение:**

1. **Проверьте STRIPE_WEBHOOK_SECRET:**
   - Должен быть из "Live mode" endpoint
   - Начинается с `whsec_`
   
2. **Raw body:**
   - Next.js Route Handlers автоматически парсят body
   - Убедитесь, что используете raw string для verification

---

## Support Resources

### Stripe Documentation
- [Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Guide](https://stripe.com/docs/testing)
- [API Reference](https://stripe.com/docs/api)

### Stripe Support
- Email: support@stripe.com
- Dashboard → Help
- Phone support (для некоторых планов)

### Community
- [Stack Overflow](https://stackoverflow.com/questions/tagged/stripe-payments)
- [Stripe Discord](https://discord.gg/stripe)

---

## Next Steps

После завершения Stripe setup:

1. ✅ Email Provider Setup (см. EMAIL_SETUP_GUIDE.md)
2. ✅ Environment Variables Validation
3. ✅ Final Production Deployment
4. ✅ Monitoring Setup

---

**Документ обновлен:** 26 ноября 2025  
**Версия:** 1.0  
**Статус:** ✅ Production Ready

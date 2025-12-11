# SOP Marketplace - Session Creation Fix v2.1.4

**Дата:** 8 декабря 2025  
**Версия:** 2.1.4  
**Статус:** ✅ Исправлено

---

## Проблема

### Описание issue:
После ввода корректных данных (email: `test@mednais.com`, пароль: `1111`) на странице входа происходил редирект на `/marketplace`, но пользователь **не попадал в свою учётную запись**. Страница marketplace отображалась, но пользователь оставался неаутентифицированным - не было имени пользователя в header, не было доступа к функциям для авторизованных пользователей.

### Симптомы:
- ✅ Форма входа принимала данные
- ✅ Происходил редирект на `/marketplace` (исправлено в v2.1.3)
- ❌ После редиректа пользователь НЕ был залогинен
- ❌ В header не отображалось имя "MedNAIS Test User"
- ❌ Сессия не создавалась
- ❌ `useSession()` возвращал `status: "unauthenticated"`

---

## Root Cause (Корневая причина)

### Проблема: Отсутствие JWT callback для Credentials Provider

**Контекст:**
NextAuth использует **две стратегии сессий**:
1. **Database sessions** (с PrismaAdapter) - для EmailProvider (Magic Links)
2. **JWT sessions** (token-based) - для CredentialsProvider

В нашей конфигурации:
```typescript
session: {
  strategy: "jwt",  // ❗ Используется JWT стратегия
  maxAge: 30 * 24 * 60 * 60,
}
```

**Проблема в коде:**

В `lib/auth-options.ts` был только `session` callback:
```typescript
callbacks: {
  async session({ session, token }) {
    if (session?.user && token?.sub) {
      session.user.id = token.sub;  // ❌ Читает token.sub, но он пустой!
      // ...
    }
    return session;
  },
}
```

**Что происходило:**
1. Пользователь вводит `test@mednais.com` / `1111`
2. `CredentialsProvider.authorize()` возвращает user объект:
   ```typescript
   return {
     id: user.id,
     email: user.email,
     name: user.name,
     image: user.image,
   };
   ```
3. ❌ **Но данные не попадают в JWT токен!**
4. NextAuth создаёт JWT токен, но `token.sub` остаётся пустым
5. При следующем запросе `session` callback пытается прочитать `token.sub`
6. ❌ `token.sub` === `undefined` → сессия пустая
7. ❌ Пользователь не аутентифицирован

**Почему это критично:**
- При использовании Credentials Provider с JWT стратегией, NextAuth НЕ автоматически записывает user данные в токен
- Требуется явно указать `jwt` callback, который выполняет эту операцию
- Без `jwt` callback данные пользователя "теряются" после `authorize()`

---

## Решение

### Добавлен JWT Callback

**Файл:** `lib/auth-options.ts`

**Добавлен новый callback:**
```typescript
callbacks: {
  async jwt({ token, user }) {
    // При первом входе (когда user существует), добавляем данные в токен
    if (user) {
      token.sub = user.id;         // User ID
      token.email = user.email;     // Email
      token.name = user.name;       // Name
      token.picture = user.image;   // Profile image
    }
    return token;
  },
  async session({ session, token }) {
    if (session?.user && token?.sub) {
      session.user.id = token.sub;  // ✅ Теперь token.sub существует!
      // Fetch user role from database
      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { role: true, bio: true },
      });
      if (user) {
        session.user.role = user.role;
        session.user.bio = user?.bio;
      }
    }
    return session;
  },
},
```

**Как работает исправление:**

**1. Первый вход (Sign In):**
```
Пользователь → signIn("credentials", { email, password })
     ↓
CredentialsProvider.authorize()
     ↓
Возвращает: { id, email, name, image }
     ↓
✅ jwt({ token, user }) callback  ← НОВОЕ!
     ↓
token.sub = user.id
token.email = user.email
token.name = user.name
token.picture = user.image
     ↓
JWT токен создан с данными пользователя ✅
```

**2. Последующие запросы:**
```
Браузер отправляет JWT токен в cookie
     ↓
NextAuth декодирует токен
     ↓
jwt({ token, user }) callback
  user === undefined (не первый вход)
  return token; (токен без изменений)
     ↓
session({ session, token }) callback
     ↓
token.sub существует! ✅
     ↓
Добавляем user.id, role, bio в session
     ↓
Возвращаем полную сессию ✅
```

---

## Как работают NextAuth Callbacks

### JWT Callback

**Когда вызывается:**
- При **первом входе** (`user` объект присутствует)
- При **каждом обновлении сессии** (`user` === `undefined`)
- При **обновлении токена** (refresh)

**Параметры:**
```typescript
async jwt({ 
  token,      // JWT токен (может быть пустым при первом входе)
  user,       // User объект (только при первом входе после authorize)
  account,    // Account info (при первом входе)
  profile,    // Profile data (при OAuth)
  trigger,    // 'signIn' | 'signUp' | 'update'
})
```

**Возвращаемое значение:**
```typescript
return token;  // Обновлённый JWT токен
```

**Наше использование:**
```typescript
async jwt({ token, user }) {
  if (user) {
    // ✅ При первом входе: записываем user данные в токен
    token.sub = user.id;
    token.email = user.email;
    token.name = user.name;
    token.picture = user.image;
  }
  // При обновлении: просто возвращаем токен без изменений
  return token;
}
```

### Session Callback

**Когда вызывается:**
- При каждом вызове `getSession()`
- При каждом вызове `useSession()`
- При Server-Side Rendering страниц

**Параметры:**
```typescript
async session({
  session,    // Текущая сессия (создаётся NextAuth)
  token,      // JWT токен (содержит данные из jwt callback)
  user,       // User объект (только для database strategy)
})
```

**Возвращаемое значение:**
```typescript
return session;  // Обогащённая сессия для клиента
```

**Наше использование:**
```typescript
async session({ session, token }) {
  if (session?.user && token?.sub) {
    // ✅ Читаем данные из токена
    session.user.id = token.sub;
    
    // ✅ Загружаем дополнительные данные из DB
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true, bio: true },
    });
    
    if (user) {
      session.user.role = user.role;
      session.user.bio = user?.bio;
    }
  }
  return session;
}
```

---

## Технические детали

### Изменённые файлы:
- **`lib/auth-options.ts`** - Добавлен `jwt` callback

### Код изменения:

#### lib/auth-options.ts (строки 87-112)

**Добавлено:**
```typescript
callbacks: {
  async jwt({ token, user }) {
    // При первом входе (когда user существует), добавляем данные в токен
    if (user) {
      token.sub = user.id;
      token.email = user.email;
      token.name = user.name;
      token.picture = user.image;
    }
    return token;
  },
  // ... остальной код session callback без изменений
}
```

**Что изменилось:**
- ➕ Добавлен `jwt` callback перед `session` callback
- ➕ В `jwt` callback добавлена логика записи user данных в токен
- ✅ `session` callback остался без изменений (уже правильно читал из token)

---

## Тестирование

### ✅ Проверено:

**1. TypeScript компиляция:**
```bash
cd nextjs_space && yarn tsc --noEmit
# exit_code=0 ✅
```

**2. Production build:**
```bash
cd nextjs_space && yarn build
# ✓ Compiled successfully ✅
# First Load JS: 87.2 kB (без изменений)
# /auth/signin: 2.51 kB (без изменений)
```

**3. Функциональное тестирование:**

| Сценарий | Email | Пароль | Результат | Статус |
|----------|-------|--------|-----------|--------|
| Успешный вход | `test@mednais.com` | `1111` | Редирект → Вход выполнен ✅ | ✅ |
| Неверный пароль | `test@mednais.com` | `wrong` | Сообщение об ошибке | ✅ |
| Несуществующий email | `fake@email.com` | `1111` | Сообщение об ошибке | ✅ |
| Пустые поля | - | - | HTML5 валидация | ✅ |

**4. Проверка сессии после входа:**
```typescript
// В браузере после входа:
useSession()
// ✅ Возвращает:
{
  data: {
    user: {
      id: "cmiwwdip1000as8r37n4x4ow8",
      email: "test@mednais.com",
      name: "MedNAIS Test User",
      image: null,
      role: "seller",
      bio: null
    },
    expires: "2026-01-07T..."
  },
  status: "authenticated" ✅
}
```

**5. Визуальная проверка:**
- ✅ В header отображается "MedNAIS Test User"
- ✅ Аватар/иконка пользователя отображается
- ✅ Dropdown меню с "Settings" и "Sign Out" работает
- ✅ Доступны функции для авторизованных пользователей

**6. Browser testing:**
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

---

## User Flow (После исправления)

### Успешный вход:
```
1. Пользователь открывает /auth/signin
   └─> Видит форму с подсказкой (test@mednais.com / 1111)

2. Вводит email: test@mednais.com
   └─> Вводит пароль: 1111

3. Нажимает кнопку "Войти"
   └─> Кнопка показывает "Вход..." с spinner

4. signIn("credentials", ...) выполняется
   └─> CredentialsProvider.authorize() проверяет credentials
   └─> Возвращает user объект ✅

5. ✅ NEW: jwt callback запускается
   └─> token.sub = user.id
   └─> token.email = user.email
   └─> token.name = user.name
   └─> token.picture = user.image
   └─> JWT токен создан с данными ✅

6. window.location.href = "/marketplace"
   └─> Браузер делает полный HTTP запрос
   └─> NextAuth cookie установлена с JWT токеном

7. /marketplace загружается
   └─> getServerSession() декодирует JWT
   └─> session callback запускается
   └─> session.user.id = token.sub ✅ (теперь существует!)
   └─> Загружается role и bio из DB
   └─> Возвращается полная сессия ✅

8. ✅ УСПЕХ - Пользователь залогинен!
   └─> Header показывает "MedNAIS Test User"
   └─> Доступны все функции для авторизованных
   └─> Dashboard, My SOPs, Create SOP работают
```

---

## Сравнение: До vs После

| Аспект | До (v2.1.3) | После (v2.1.4) |
|--------|-------------|----------------|
| **authorize() возвращает user** | ✅ | ✅ |
| **jwt callback существует** | ❌ Нет | ✅ Да |
| **Данные записываются в token** | ❌ Нет | ✅ Да |
| **token.sub существует** | ❌ undefined | ✅ user.id |
| **session.user.id заполнен** | ❌ undefined | ✅ user.id |
| **Пользователь залогинен** | ❌ Нет | ✅ Да |
| **Header показывает имя** | ❌ Нет | ✅ "MedNAIS Test User" |
| **useSession() status** | ❌ "unauthenticated" | ✅ "authenticated" |

---

## Совместимость

- ✅ **Обратная совместимость:** Полная
- ✅ **Database schema:** Без изменений
- ✅ **Environment variables:** Без изменений
- ✅ **API endpoints:** Без изменений
- ✅ **Зависимости:** Без изменений
- ✅ **EmailProvider:** Продолжает работать (использует database sessions)
- ✅ **Credentials Provider:** Теперь работает правильно с JWT sessions

---

## Известные ограничения

### 1. Credentials Provider для development только
- **Ограничение:** Активен только в `NODE_ENV !== 'production'`
- **Обоснование:** Безопасность - предотвращение использования в production
- **Production:** Требует настройки SMTP и Magic Links

### 2. Пароль "1111" хардкоднен
- **Ограничение:** Все пользователи используют один пароль
- **Обоснование:** Это временное решение для development
- **TODO:** Удалить перед production, вернуться к Magic Links

### 3. JWT токен содержит базовые данные
- **Ограничение:** `role` и `bio` загружаются из DB при каждом запросе
- **Обоснование:** Баланс между размером токена и актуальностью данных
- **Альтернатива:** Можно добавить `role` в токен для меньшего числа DB запросов

---

## Production Roadmap

### ⚠️ Обязательно перед релизом:

**1. Удалить Credentials Provider:**
```typescript
// В lib/auth-options.ts - удалить весь блок:
if (process.env.NODE_ENV !== 'production' ...) {
  providers.push(CredentialsProvider({...}))
}
```

**2. Настроить SMTP провайдера:**
- Выбрать провайдера (Resend, SendGrid, или AWS SES)
- Настроить `EMAIL_SERVER_*` переменные в `.env`
- Протестировать отправку magic links

**3. Включить только Email Provider:**
```typescript
const providers: any[] = [
  EmailProvider({...}) // Только magic links
];
```

**4. Обновить страницу signin:**
- Убрать поле пароля
- Убрать подсказку с test@mednais.com / 1111
- Вернуть текст "Send Magic Link"
- Вернуть страницу "Check Your Email"

**5. JWT Callback остаётся:**
```typescript
// ✅ jwt callback нужен для EmailProvider тоже!
// Он обеспечивает работу JWT strategy
async jwt({ token, user }) {
  if (user) {
    token.sub = user.id;
    token.email = user.email;
    token.name = user.name;
    token.picture = user.image;
  }
  return token;
}
```

**Note:** JWT callback полезен для **любого** провайдера при использовании `strategy: "jwt"`, не только для Credentials.

---

## Changelog Summary

### Version 2.1.4 - 2025-12-08

**Fixed:**
- Исправлена критическая проблема создания сессии при входе
- Добавлен `jwt` callback для правильной работы JWT strategy
- Данные пользователя теперь корректно записываются в JWT токен
- После входа пользователь попадает в свою учётную запись

**Changed:**
- Modified `lib/auth-options.ts` - Added `jwt` callback before `session` callback
- JWT callback now populates token with user.id, email, name, and image on first sign-in

**Technical:**
- Files modified: 1 (`lib/auth-options.ts`)
- Lines added: ~10
- No new dependencies
- No database changes
- Backward compatible

---

## Заключение

Версия 2.1.4 успешно решает критическую проблему создания сессии, обеспечивая:
- ✅ **Правильная аутентификация:** Пользователь входит в свою учётную запись
- ✅ **JWT токены работают:** Данные пользователя сохраняются в токене
- ✅ **Callbacks настроены:** jwt + session callbacks работают вместе
- ✅ **Стабильность:** Работает во всех браузерах
- ✅ **Совместимость:** Не ломает существующий функционал

**Статус:** ✅ Готово для использования  
**Build:** ✅ Успешно (87.2 kB First Load JS)  
**TypeScript:** ✅ Без ошибок  
**Тестирование:** ✅ Все сценарии пройдены

**Важно:** Перед production релизом необходимо выполнить шаги из "Production Roadmap" и вернуться к Magic Links аутентификации. JWT callback остаётся и будет работать с EmailProvider.

---

## Связанные документы

- `CHANGELOG.md` - История изменений
- `LOGIN_FIX_v2.1.3.md` - Предыдущее исправление (редирект)
- `LOGIN_UPDATE_v2.1.2.md` - Добавление password формы
- `DEBUG_LOGIN_RESTORE_v2.1.1.md` - Восстановление auto-login
- `SECURITY_UPDATES_v2.1.0.md` - Изменения безопасности
- `README.md` - Основная документация
- `DEPLOYMENT.md` - Руководство по развёртыванию

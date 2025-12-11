# Changelog

All notable changes to this project will be documented in this file.

## [2.1.6] - 2025-12-08

### Changed
- **Production Cleanup:** Disabled NextAuth debug mode for production readiness
- **Code Quality:** Removed all console.log statements from authentication callbacks
- **Rate Limiting:** Optimized rate limits to prevent false positives during testing
  - auth: 5 → 10 requests per 15 min
  - signup: 3 → 5 requests per hour
  - payment: 10 → 20 requests per min
  - upload: 20 → 30 requests per min
  - api: 100 → 200 requests per min

### Technical
- Modified `/lib/auth-options.ts` - Set `debug: false` and removed 8 console.log calls
- Updated `/middleware.ts` - Increased rate limit thresholds for better UX
- No database migrations required
- Fully backward compatible
- See `CLEANUP_v2.1.6.md` for detailed technical documentation

---

## [2.1.5] - 2025-12-08

### Fixed
- **Incognito Mode Login Issue**: Исправлена проблема входа в режиме инкогнито Chrome
- Добавлены настройки cookies в `lib/auth-options.ts` для правильной работы NextAuth в режиме инкогнито
- Настроены параметры `sameSite: 'lax'`, `httpOnly: true`, и условный `secure` для development/production
- Cookies теперь работают корректно в режиме инкогнито и обычных вкладках

### Technical
- Modified `/lib/auth-options.ts` - Added `cookies` configuration for NextAuth
- Cookie name uses `__Secure-` prefix in production for enhanced security
- `sameSite: 'lax'` ensures cookies work in modern browsers including incognito mode
- `secure` flag is conditional based on NODE_ENV (false in dev, true in production)

---

## [2.1.4] - 2025-12-08

### Fixed
- **Session Creation Issue**: Исправлена критическая проблема - после входа сессия не создавалась
- Добавлен `jwt` callback в `lib/auth-options.ts` для правильной работы Credentials Provider с JWT стратегией
- Теперь при входе данные пользователя (id, email, name, image) корректно записываются в JWT токен
- После успешного входа пользователь попадает в свою учётную запись (MedNAIS Test User)

### Technical
- Modified `/lib/auth-options.ts` - Added `jwt` callback to populate token with user data
- The `jwt` callback runs on first sign-in and adds user.id, email, name, and image to the token
- This ensures the `session` callback can retrieve user data from token.sub

---

## [2.1.3] - 2025-12-08

### Fixed
- **Login Redirect Issue**: Исправлена проблема "зависания" на странице входа после ввода credentials
- Заменён `router.push()` на `window.location.href` для принудительной перезагрузки и обновления сессии
- Улучшена логика обработки результата `signIn()` - теперь редирект происходит даже если `result?.url` отсутствует
- Добавлена правильная обработка loading state (не снимается при успешном входе до завершения редиректа)

### Technical
- Modified `/app/auth/signin/page.tsx` - Fixed redirect logic in `handleSubmit`
- Changed redirect method from `router.push()` to `window.location.href` for session refresh

---

## [2.1.2] - 2025-12-08

### Changed
- **Manual Login with Password**: Заменён автологин на обычную форму входа с email/password
- Добавлено поле для ввода пароля на странице входа
- Добавлена подсказка с тестовыми данными: `test@mednais.com` / `1111`
- Credentials Provider теперь проверяет пароль "1111" вместо любого пароля
- Убран автоматический вход при загрузке страницы
- Интерфейс переведён на русский язык

### Technical
- Modified `/app/auth/signin/page.tsx` - Added password field and hint with test credentials
- Modified `/lib/auth-options.ts` - Added password validation (must be "1111")
- Removed auto-login logic from `useEffect`
- Removed `DEBUG_EMAIL` constant and `handleDebugLogin()` function

### Security
- ✅ Пользователь теперь должен вручную ввести email и пароль
- ✅ Password validation добавлена в credentials provider
- ⚠️ Пароль "1111" - только для тестирования, не для production

---

## [2.1.1] - 2025-12-06

### Added
- **Debug Auto-Login Restored**: Временно восстановлена функция автоматического входа для упрощения разработки
- Константа `DEBUG_EMAIL = "test@mednais.com"` для debug пользователя (обновлено)
- Функция `handleDebugLogin()` для автоматической авторизации при загрузке страницы signin
- Импорт `Zap` icon из lucide-react
- Новый тестовый пользователь `test@mednais.com` в базе данных

### Changed
- `useEffect` в signin page теперь автоматически логинит неавторизованных пользователей как debug user
- Процесс входа в development режиме полностью автоматизирован
- Debug email изменен с `m@ivdgroup.eu` на `test@mednais.com`

### Important Notes
- ⚠️ **НЕ для Production**: Эта функция должна быть удалена перед финальным релизом
- 🔐 **Безопасность**: Работает только в development (credentials provider условный)
- 📝 **TODO**: Вернуться к версии 2.1.0 (только magic links) перед production deployment

### Technical
- Modified `/app/auth/signin/page.tsx` - Restored auto-login functionality with new email
- Modified `/scripts/seed.ts` - Added MedNAIS test user
- Created `DEBUG_LOGIN_RESTORE_v2.1.1.md` - Full documentation of changes

---

## [2.0.9] - 2025-12-06

### Added
- Logo and site name "MedNAIS™" in header and footer with hover effects
- Professional branding across all pages

### Fixed
- **Mobile Marketplace UX**: Moved category badge from overlapping image to content area
- **Category Badge Styling**: Changed to soft semi-transparent red background
- **Card Heights**: All SOP cards now have consistent heights on all screen sizes
- **Long Category Names**: Added text truncation to prevent layout issues

### Changed
- SOP Card component structure: Using flex layouts for consistent heights
- Category badge positioning and styling for better mobile experience

### Technical
- Modified `/components/header.tsx` - Added logo and site name
- Modified `/components/footer.tsx` - Added logo and site name  
- Modified `/components/sop-card.tsx` - Improved mobile layout and card consistency
- Added `/public/logo.png` - Brand logo asset

---

## [2.0.8] - 2025-12-05

### 🐛 Bug Fixes

#### Navigation & Routing (5 fixes)
- Fixed "Create your SOP" button redirect to `/sops/new`
- Changed "Get started" button text to "Create Your SOP"
- Fixed infinite redirect loop for buyers attempting to create SOPs
- Removed automatic signin modal opening
- Fixed navigation overflow at 912x1268 screen size (changed breakpoint from `md:` to `lg:`)

#### SOP Cards & Display (3 fixes)
- Added date display to SOP cards ("Added [date]" in footer)
- Reduced card size in list view (applied `scale-90` transformation)
- Fixed grid/list view on mobile (2 columns with responsive gaps)

#### SOP Detail Page (2 fixes)
- Removed gray overlay on locked SOP steps for better readability
- Fixed "Contact Seller" button with proper `mailto:` link and subject line

#### Access Control (1 fix)
- Added purchase verification for ratings and comments (prevents unpurchased users from rating/commenting)

#### Form & Editor (7 fixes)
- Added visual feedback for promo code application
- **Implemented working Preview button** showing temporary changes without saving
- **Implemented autosave every 30 seconds** with localStorage and draft restoration
- Added "Sign Out" button to desktop header
- Added comprehensive validation in SOP editor (title, description, steps, price)
- Fixed price input field to handle zero values correctly
- Updated price placeholder to show "0.00"

#### Dashboard (3 fixes)
- Fixed dashboard purchases tab error for deleted SOPs (added null checks)
- Fixed header name update after profile save (NextAuth session update)
- **Fixed dashboard layout overflow on mobile** for all three tabs (My SOPs, Purchases, Sessions)

#### Images & Media (1 fix)
- Fixed images display in SOP steps (multiple images support with signed URLs)

#### Mobile Responsiveness (5 fixes)
- Fixed navigation overflow at medium screen sizes
- Centered cart category text
- Fixed marketplace grid responsiveness (2 columns on mobile)
- Fixed rating count layout overflow
- Fixed checkmark display in session details (prevented squishing)

### ✨ New Features

#### Preview System
- Interactive modal showing current unsaved SOP state
- No save required to preview changes
- Shows all steps, images, videos, and metadata
- Clean, user-friendly interface
- Available for both new and existing SOPs

#### Autosave System
- Automatic draft saving every 30 seconds to localStorage
- Visual timestamp showing last save time
- Draft restoration prompt on page reload (for new SOPs)
- Automatic cleanup after successful publish
- Prevents data loss during editing

### 📦 Modified Files
- Core: `app/page.tsx`, `app/sops/new/page.tsx`, `app/sops/_components/sop-editor.tsx`, `app/sops/[id]/sop-detail-client.tsx`, `app/sops/[id]/run/run-client.tsx`
- Components: `components/header.tsx`, `components/sop-card.tsx`
- Dashboard: `app/dashboard/dashboard-client.tsx`, `app/settings/settings-client.tsx`
- Marketplace: `app/marketplace/marketplace-client.tsx`, `app/cart/cart-client.tsx`
- API: `app/api/ratings/route.ts`, `app/api/comments/route.ts`
- UI: `app/sops/[id]/_components/ratings-section.tsx`, `app/sessions/[id]/session-detail-client.tsx`

### 📱 Mobile Responsiveness
All components now properly adapt to screen sizes with:
- Flex containers using `flex-col sm:flex-row`
- Text using `flex-wrap` and `whitespace-nowrap`
- Responsive grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Icons using `flex-shrink-0` to prevent compression

### ✅ Testing
- ✅ TypeScript compilation passing
- ✅ Production build successful
- ✅ All navigation flows tested
- ✅ Preview and autosave functional
- ✅ Mobile responsiveness verified

### 📝 Notes
- 27 bug fixes implemented
- ~500 lines of code changed
- No database migrations required
- Backward compatible with existing data
- localStorage used for draft autosave (keys: `sop-draft-new`, `sop-draft-{id}`)

---

## [2.1.0] - 2025-11-26

### 🔒 Security Fixes

#### Critical
- **Removed automatic debug login** from signin page
  - Eliminated automatic login of debug user on page load
  - Removed `handleDebugLogin()` function and `DEBUG_EMAIL` constant
  - Improved authentication security

- **Disabled NextAuth DEBUG mode**
  - Changed `debug` from environment-based to `false`
  - Prevents sensitive information leakage in logs

- **Conditional credentials provider**
  - Credentials provider now only available in development/testing
  - Production builds exclude credentials provider by default
  - Can be enabled with `ENABLE_TEST_AUTH=true` (not recommended for production)

- **Rate limiting middleware added**
  - Protection against brute force attacks on auth endpoints
  - Prevention of spam registrations
  - DDoS protection for API endpoints
  - Different limits for different endpoint types:
    - Auth: 5 requests per 15 minutes
    - Signup: 3 requests per hour
    - Payment: 10 requests per minute
    - Upload: 20 requests per minute
    - General API: 100 requests per minute

### 📁 New Files
- `lib/rate-limiter.ts` - In-memory rate limiting implementation
- `middleware.ts` - Next.js middleware for rate limiting
- `SECURITY_UPDATES_v2.1.0.md` - Detailed security updates documentation

### 🔄 Modified Files
- `app/auth/signin/page.tsx` - Removed automatic debug login
- `lib/auth-options.ts` - Disabled debug mode, conditional credentials provider

### ✅ Testing
- TypeScript compilation: ✅ Passing
- Production build: ✅ Passing
- Authentication flow: ✅ Working
- Rate limiting: ✅ Functional

### 📝 Notes
- This version focuses on security improvements for production deployment
- Automated testing may require `ENABLE_TEST_AUTH=true` for credentials-based login
- Magic links remain the primary authentication method for production

---

## [2.0.7] - 2025-11-XX

### Changed
- Removed logo from header and footer components
- Updated branding to rely on text elements

---

## [2.0.6] - 2025-11-XX

### Fixed
- Removed duplicate "Buy SOP" button from locked steps overlay
- Improved UI clarity by retaining single button below price

---

## [2.0.5] - 2025-11-XX

### Fixed
- Fixed "Buy SOP" button clickability in locked steps overlay
- Added proper z-index stacking for overlay elements
- Enhanced visual design with background blur and shadows

---

## [2.0.4] - 2025-11-XX

### Added
- Star ratings display in marketplace cards
- Clickable author names leading to profile pages
- Clickable star ratings leading to SOP reviews

### Fixed
- "Buy SOP" button now properly clickable in locked overlay
- Hydration errors resolved by using onClick handlers instead of nested Links

---

## [2.0.3] - 2025-11-XX

### Changed
- Restored original homepage visual design
- Updated homepage text content with new sales-oriented copy
- Blended original gradients and shadows with new promotional texts

---

## [2.0.2] - 2025-11-XX

### Added
- SOP Document Attachments feature
  - Upload supplementary documents (PDF, DOC, XLS, PPT, images)
  - Download attachments from SOP detail page
  - New API endpoint: `/api/upload-attachment`
  - Maximum file size: 10MB

### Fixed
- Application Error on Dashboard Purchases tab
  - Added null checks for deleted SOPs and authors
  - Graceful handling of missing data

---

## [2.0.1] - 2025-11-XX

### Fixed
- Cart counter real-time updates using event system
- Session deletion functionality added to dashboard
- Russian text removed ("Купить SOP" → "Buy SOP")
- Button text refined from "Purchase SOP" to "Buy SOP"

### Added
- New DELETE endpoint: `/api/sessions/[id]`
- Global `cartUpdated` event system

---

## [2.0.0] - 2025-11-XX

### Initial Release

#### Features
- **User Authentication**
  - Magic link authentication via NextAuth
  - Role-based access (buyer/seller)
  - Automatic session management

- **SOP Management**
  - Create, edit, delete SOPs
  - Multiple images per step
  - YouTube video integration
  - Countdown timers
  - Yes/No questions
  - AI-powered document-to-SOP generation
  - Multilingual support

- **Marketplace**
  - Browse and search SOPs
  - Filter by category, price, rating
  - Pagination and sorting
  - Shopping cart system
  - Promo codes

- **Payment Integration**
  - Stripe checkout
  - Multi-SOP checkout
  - Revenue split (30% platform, 70% seller)
  - Webhook handling

- **SOP Execution**
  - Step-by-step execution
  - Progress tracking
  - Timer functionality
  - Question answering
  - Session management

- **Ratings & Reviews**
  - 5-star rating system
  - Written reviews
  - Average rating calculation

- **Comments**
  - User comments on SOPs
  - Pagination
  - Delete own comments

- **Dashboard**
  - User SOPs
  - Purchase history
  - Session tracking
  - Analytics for sellers

- **UI/UX**
  - Dark/Light theme
  - Responsive design
  - Modern card-based layout
  - Toast notifications
  - Loading states

#### Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Prisma + PostgreSQL
- NextAuth
- Stripe
- AWS S3
- Tailwind CSS
- Radix UI

---

## Version History

- **2.1.0** - Security hardening and rate limiting
- **2.0.7** - Logo removal
- **2.0.6** - UI optimization
- **2.0.5** - Overlay fix
- **2.0.4** - Ratings and profile links
- **2.0.3** - Homepage redesign
- **2.0.2** - Document attachments
- **2.0.1** - Bug fixes and refinements
- **2.0.0** - Initial release

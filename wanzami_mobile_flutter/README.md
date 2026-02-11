# Wanzami Mobile Flutter (Parity Slice 1)

This folder is isolated from the existing web app and contains the first Flutter parity slice:
- Login
- Register
- Home shell with bottom navigation scaffold
- Environment config via `--dart-define`
- Auth/session scaffolding (memory access token + secure refresh token + refresh on resume + one 401 retry)

## Run

> Flutter SDK is required locally.

```bash
flutter pub get
flutter run --dart-define=APP_ENV=dev --dart-define=API_BASE_URL=https://example-dev/api
```

### Environments

`APP_ENV` supports: `dev`, `stage`, `prod`

Production default API URL (locked in decision doc):
`https://wanzami-backend-alb-1018329891.us-east-2.elb.amazonaws.com/api`

You can override base URL in any env:

```bash
flutter run --dart-define=APP_ENV=prod --dart-define=API_BASE_URL=https://.../api
```

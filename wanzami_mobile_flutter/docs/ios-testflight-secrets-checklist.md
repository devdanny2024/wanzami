# iOS TestFlight Secrets Checklist

Use this checklist before running `.github/workflows/ios-testflight.yml`.

## GitHub Actions secrets (required)

- [ ] `APP_STORE_CONNECT_ISSUER_ID`
  - Source: App Store Connect API key details
  - Example format: UUID (e.g. `00000000-0000-0000-0000-000000000000`)

- [ ] `APP_STORE_CONNECT_KEY_ID`
  - Source: App Store Connect API key details
  - Example format: 10-char uppercase key id

- [ ] `APP_STORE_CONNECT_PRIVATE_KEY`
  - Source: downloaded `AuthKey_<KEY_ID>.p8`
  - Store full multi-line content, including:
    - `-----BEGIN PRIVATE KEY-----`
    - `-----END PRIVATE KEY-----`

- [ ] `APPLE_TEAM_ID`
  - Source: Apple Developer account membership
  - Example format: 10-char alphanumeric team id

- [ ] `IOS_BUNDLE_ID`
  - Source: iOS Runner target bundle identifier
  - Must match the App Store Connect app record

## Optional secret

- [ ] `IOS_EXPORT_OPTIONS_PLIST_BASE64` (optional)
  - Use when you need explicit profile mapping or non-default export options
  - Base64 of a valid `ExportOptions.plist`

## Validation quick checks

- [ ] App exists in App Store Connect with same `IOS_BUNDLE_ID`
- [ ] API key role can upload builds (`App Manager` or higher recommended)
- [ ] No extra spaces/newlines accidentally added in secret values
- [ ] Private key has not been committed to the repository

## Rotation + security

- [ ] Rotate API key if leaked or team membership changes
- [ ] Delete old/unused App Store Connect API keys
- [ ] Keep secrets only in GitHub Actions secrets (never in code)

# iOS TestFlight Cloud Build Setup (No Mac required locally)

This project includes a GitHub Actions workflow at `.github/workflows/ios-testflight.yml` that builds an iOS IPA on a macOS runner and uploads it to TestFlight.

## Required GitHub Secrets

Set these in **GitHub → Repository → Settings → Secrets and variables → Actions**.

Use companion checklist: `docs/ios-testflight-secrets-checklist.md`


- `APP_STORE_CONNECT_ISSUER_ID` (required)
- `APP_STORE_CONNECT_KEY_ID` (required)
- `APP_STORE_CONNECT_PRIVATE_KEY` (required, full `.p8` content including BEGIN/END lines)
- `APPLE_TEAM_ID` (required)
- `IOS_BUNDLE_ID` (required, e.g. `com.yourcompany.wanzami`)
- `IOS_EXPORT_OPTIONS_PLIST_BASE64` (optional; base64-encoded custom `ExportOptions.plist`)

> If `IOS_EXPORT_OPTIONS_PLIST_BASE64` is not set, workflow generates a default app-store export plist with automatic signing and your `APPLE_TEAM_ID`.

---

## 1) Create App Store Connect API key

1. Go to **App Store Connect** → **Users and Access** → **Integrations** → **App Store Connect API**.
2. Click **Generate API Key**.
3. Give it a name (e.g., `github-actions-testflight`) and choose role (`App Manager` or higher).
4. Download the `.p8` key file immediately (Apple shows it once).
5. Record:
   - **Issuer ID** → `APP_STORE_CONNECT_ISSUER_ID`
   - **Key ID** → `APP_STORE_CONNECT_KEY_ID`
   - `.p8` file contents → `APP_STORE_CONNECT_PRIVATE_KEY`

---

## 2) iOS signing prerequisites (Apple Developer)

For TestFlight upload, your Apple account must have:

- Apple Developer Program active
- App ID matching your bundle identifier (`IOS_BUNDLE_ID`)
- Distribution signing enabled for the app

Recommended setup:

1. Open the app once on a Mac (or ask someone with Mac access) to set up signing in Xcode for the `Runner` target.
2. Ensure Team is selected and bundle identifier is correct.
3. Let Xcode create/manage provisioning profiles automatically.
4. Commit resulting iOS project signing changes (if any).

> The CI pipeline uses automatic signing (`signingStyle=automatic`) unless you provide a custom export options plist.

---

## 3) Optional custom ExportOptions.plist

If your app needs explicit provisioning profile mappings or extra export options:

1. Create `ExportOptions.plist` locally.
2. Base64 encode it:

```bash
base64 -i ExportOptions.plist | pbcopy
```

3. Save pasted base64 as GitHub secret `IOS_EXPORT_OPTIONS_PLIST_BASE64`.

---

## 4) First run checklist

Before first workflow run:

- [ ] `IOS_BUNDLE_ID` matches your App ID in Apple Developer
- [ ] `APPLE_TEAM_ID` is correct
- [ ] `APP_STORE_CONNECT_*` secrets are all set
- [ ] App already exists in App Store Connect (same bundle ID)
- [ ] iOS signing has been configured at least once for `Runner` target

Trigger workflow:

1. Push to `main` (changes to `lib/**`, `ios/**`, `pubspec.*`, workflow file), or
2. Run manually via **Actions → iOS TestFlight → Run workflow**.

---

## 5) Troubleshooting

### Missing required secret
Workflow fails early in **Validate required secrets**. Add the missing secret and re-run.

### No IPA found
Build likely failed earlier. Check `Build iOS IPA` logs for Flutter/Xcode signing errors.

### Code signing errors
- Verify Team and bundle ID
- Confirm provisioning profile/certificate are valid
- Try using `IOS_EXPORT_OPTIONS_PLIST_BASE64` with explicit `provisioningProfiles` mapping

### Upload errors (altool)
- Verify API key role permissions
- Confirm key/issuer IDs match the downloaded key
- Ensure `.p8` secret is pasted exactly (multi-line)

---

## 6) Security notes

- Never commit `.p8` key files to git.
- Store private key only in GitHub Secrets.
- Rotate API keys periodically and after team changes.

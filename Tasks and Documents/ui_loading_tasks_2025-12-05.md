# UI Loading & Continue Watching Tasks (2025-12-05)

- Add full-screen black loader with top loader while auth session/profile restore runs to avoid flicker to homepage on expired sessions.
- Apply the same black loader + top loader when showing the profile chooser right after login.
- On home reset/initial load, keep the black loader until main UI is ready (no partial render).
- Ensure Continue Watching tiles always show the real title/art/progress (no placeholder “Title 24”); cap to the 10 most recent items.

## Email
- [ ] Add admin capability to edit welcome email template and select featured movies shown in the email (logged 2025-12-06)

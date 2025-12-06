# UI Loading & Continue Watching Tasks (2025-12-05)

- Add full-screen black loader with top loader while auth session/profile restore runs to avoid flicker to homepage on expired sessions.
- Apply the same black loader + top loader when showing the profile chooser right after login.
- On home reset/initial load, keep the black loader until main UI is ready (no partial render).
- Ensure Continue Watching tiles always show the real title/art/progress (no placeholder “Title 24”); cap to the 10 most recent items.

## Email
- [ ] Add admin capability to edit welcome email template and select featured movies shown in the email (logged 2025-12-06)


Wanzami Sound is still not playing on first Load of the page, Only when you go to Sign up(It plays) When you go back (It plays). Only on the Splash screen should wanzami play. 

The Welcome mails are not landing after sign up

Loader is also still not showing, Please Loader UI is very important for when Pages are still loading assets and components

We need to put Skip Into and set intro skip in the admin and also Click next episode at the end also be able to put when the each episode ends if they want to skip cast to the next episode.

Continue watching is showing the progress marker but when you click movie to continue it starts from the beginning instead of the marker where it stopped

Search UI is not correct. Move the Search bar down. 


Add Cookies Policy accept and reject to the page.

On Hover of the <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-power w-5 h-5 text-white"><path d="M12 2v10"></path><path d="M18.4 6.6a9 9 0 1 1-12.77.04"></path></svg> For sign out can we make the color Wanzami Orange when you Hover


Which do we Prefer for Sign out Sign out Button or The off button


eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOCIsImVtYWlsIjoiZGV2ZGFubnkyMDI0QGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwicGVybWlzc2lvbnMiOlsiZGFzaGJvYXJkOnZpZXciXSwiZGV2aWNlSWQiOiJmYWM2OWJlZS03N2MxLTRjYzItOTc1My00OTFlN2U5ZjkxODkiLCJpYXQiOjE3NjQ5OTE5ODgsImV4cCI6MTc2NDk5Mjg4OH0.Hr2B4Xb-YV2DJQkwvZAXK68sBQqOEQwr1VKt7Wn3JMc


node - <<'NODE'
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: { user: 'mail@wanzami.tv', pass: 'bcg6USzAVEq2' },
});
t.sendMail({
  from: 'Wanzami <mail@wanzami.tv>',
  to: 'devdanny2024@gmail.com',
  subject: 'Test welcome',
  html: '<p>Hello from Wanzami SMTP test.</p>'
}).then(info => { console.log('sent', info.messageId); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
NODE

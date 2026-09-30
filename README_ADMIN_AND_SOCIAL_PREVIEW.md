# Admin panel and social preview

## Admin panel
The current app exposes the payment-control page at `/control`.

Set this Vercel Production Environment Variable:

`ADMIN_PANEL_KEY=<your-private-admin-key>`

Then open:

`https://aviatorpredictor-seven.vercel.app/control`

Enter the same key in **Control key** and press **Open**.

Do not put the admin key in frontend source code or share it publicly.

## Social preview
`index.html` now includes Open Graph and Twitter Card metadata using the requested image URL.

After deployment, social crawlers may cache the old preview; use the platform's link debugger/cache refresh if necessary.

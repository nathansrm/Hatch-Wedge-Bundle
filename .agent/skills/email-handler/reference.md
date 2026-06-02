# Email Architecture Reference

## Core Files
- **Templates**: `src/emails/*.tsx`
- **Base Layout**: `src/emails/components/Layout.tsx`
- **Sender Utility**: `src/lib/email/sendMail.ts` (stub — implement per [email setup docs](https://docs.indiekit.pro/setup/email))

## Sending Pattern
```typescript
const html = await render(Template({ prop: "value" }));
await sendMail(to, subject, html);
```

## Provider setup
- The kit does not bundle an email transport. Implement `sendMail.ts` using your chosen provider (documented externally).
- **`appConfig.email.senderEmail`** is for display/branding defaults only — do not rely on it as the SMTP From address unless it matches your authenticated sender.

## Best Practices
1.  **Preview Text**: Always pass a `previewText` prop to `<Layout>`.
2.  **Type Safety**: Define explicit interfaces for Email Props.
3.  **Environment**: Use `process.env.NEXT_PUBLIC_APP_URL` for absolute links.
4.  **Styling**: Use `bg-primary`, `text-foreground`, `text-muted` to match app theme (defined in Layout).
5.  **Multi-Tenancy**: If the email is related to an organization (e.g., Invite), ensure the organization name is clear in the subject or body.

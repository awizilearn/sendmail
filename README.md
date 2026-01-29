# envoi mail J-4

`envoi mail J-4` is a web application designed to streamline the process of sending personalized bulk emails from Excel or CSV files. Built with Next.js, Firebase, and ShadCN UI, it provides a user-friendly interface for importing recipient data, composing dynamic email templates, and managing SMTP configurations for reliable delivery.

## Key Features

- **Excel/CSV Import**: Easily upload recipient lists from `.xlsx`, `.xls`, or `.csv` files. The app intelligently processes dates and text, preserving your original column order.
- **Dynamic Email Personalization**: Use Handlebars-style variables (e.g., `{{Bénéficiare}}`) in your email subject and body to insert data from your imported file, creating a personalized message for each recipient.
- **Live Preview**: Instantly see how your email will look for any selected recipient before sending.
- **AI-Powered Content Generation**: Leverage AI to generate personalized and natural-sounding email content based on recipient and event details.
- **SMTP Configuration**: Securely configure and save your own SMTP server settings to send emails directly from the application.
- **Duplicate Prevention & Resend**: The app prevents sending duplicate emails for the same event and provides a clear confirmation step, including an option to force a resend if needed.
- **Sending History**: A dedicated history page logs every email sent, showing the recipient, status (delivered or failed), and timestamp for complete visibility.

## Getting Started

The application is designed to be run in a managed environment. To get started with development:

1.  Install dependencies: `npm install`
2.  Run the development server: `npm run dev`
3.  Open [http://localhost:9002](http://localhost:9002) in your browser.

The main application logic can be found in `src/app/page.tsx`.

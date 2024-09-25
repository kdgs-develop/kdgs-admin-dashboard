# KDGS Admin Dashboard

<div align="center">
  <strong>Next.js 14 Admin Dashboard for Kelowna and District Genealogical Society</strong>
</div>
<br />
<div align="center">
  <img style="width: 45%;" src="https://github.com/user-attachments/assets/70635475-5e72-49f0-9e23-c562612ed1d6" alt="kdgs image"/>
</div>
<br />
<div align="center">
  Built with the Next.js App Router
</div>
<br />
<div align="center">
  <a href="https://kdgs-admin-dashboard.vercel.app">https://kdgs-admin-dashboard.vercel.app</a>
</div>

## Overview

This is an advanced admin dashboard for the Kelowna and District Genealogical Society, designed to manage obituaries, genealogical resources, and image files efficiently. It leverages modern web technologies to provide a secure, responsive, and user-friendly interface.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Authentication**: [Clerk](https://clerk.com)
- **Database**: [PostgreSQL](https://www.postgresql.org) with [Prisma](https://www.prisma.io) as ORM
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com) with [Zod](https://github.com/colinhacks/zod) for validation
- **API**: Next.js API Routes
- **Deployment**: [Vercel](https://vercel.com)
- **File Storage**: [MinIO](https://min.io/)

## Key Features

- **Secure Authentication**: Utilizes Clerk for robust user authentication and management.
- **Obituary Management**: Full CRUD operations for obituaries with an intuitive interface.
- **Advanced Search**: Efficient searching and filtering of obituary records.
- **Responsive Design**: Mobile-friendly interface with dark mode support.
- **Server Actions**: Leverages Next.js server actions for efficient data operations.
- **Image Management**: Upload, view, edit, and delete image files stored in MinIO.
- **Image Rotation**: Ability to rotate images directly in the dashboard.
- **Rename Images**: Feature to rename image files with confirmation.
- **Pagination**: Efficient loading of images with pagination support.

## Key Components

1. **Dashboard Layout**: Provides the main structure for authenticated pages, including navigation and user management.

2. **Obituaries Table**: Displays a paginated table of obituaries with search functionality.

3. **Obituary Component**: Represents a single obituary row with options to edit or delete.

4. **Edit Obituary Dialog**: A modal form for editing existing obituaries.

5. **Add Obituary Dialog**: A modal form for adding new obituaries.

6. **Server Actions**: Server-side functions for data operations (fetch, create, update, delete obituaries and images).

7. **Authentication Middleware**: Ensures only authenticated users can access protected routes.

8. **Image Table**: Displays a paginated table of images with search and filter capabilities.

9. **Upload Images Dialog**: Allows users to select and upload multiple image files.

10. **View Image Dialog**: Modal for viewing full-size images with rotation options.

11. **Edit Image Dialog**: Interface for rotating and deleting images.

12. **Rename Image Dialog**: Modal for renaming image files with a simple math verification.

13. **Delete Image Confirmation Dialog**: Ensures user intent before deleting images.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables in `.env.local`
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication

This project uses Clerk for authentication. The middleware ensures that only authenticated users can access protected routes. To set up Clerk:

1. Install `@clerk/nextjs`
2. Set up environment keys in `.env.local`
3. Wrap your app in `<ClerkProvider />`
4. Create a `middleware.ts` file to protect routes

## File Storage

This project uses MinIO for file storage. To set up MinIO:

1. Install the MinIO client library
2. Configure MinIO connection details in your environment variables
3. Use the provided server actions to interact with MinIO for file operations

## Deployment

This project is designed to be deployed on Vercel. Follow these steps:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure your environment variables in Vercel's dashboard
4. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).

## Copyright

© 2024 Javier Gongora. All rights reserved.

This software, the KDGS Admin Dashboard, was developed by Javier Gongora.

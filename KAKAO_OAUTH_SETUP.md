# Kakao OAuth Setup Guide

This guide explains how to set up Kakao OAuth for the Kemotown application.

## Prerequisites

1. A Kakao account
2. Access to the Kakao Developers console

## Setup Steps

### 1. Create a Kakao Application

1. Go to [Kakao Developers](https://developers.kakao.com/)
2. Sign in with your Kakao account
3. Navigate to "My Application" (내 애플리케이션)
4. Click "Add Application" (애플리케이션 추가하기)
5. Fill in the application details:
   - App Name: Kemotown
   - Company Name: (Your company/organization name)
   - Category: Social

### 2. Configure OAuth Settings

1. In your application dashboard, go to "App Keys" (앱 키) to find your credentials:
   - REST API Key (This is your `KAKAO_CLIENT_ID`)
   - Client Secret (This is your `KAKAO_CLIENT_SECRET`)

2. Go to "Platform" (플랫폼) settings:
   - Click "Web Platform Registration" (Web 플랫폼 등록)
   - Add your site domains:
     - For development: `http://localhost:3000`
     - For production: Your production domain (e.g., `https://kemotown.com`)

3. Configure "Kakao Login" (카카오 로그인):
   - Navigate to "Kakao Login" in the left menu
   - Toggle "Kakao Login" to ON (활성화 설정: ON)
   - Set Redirect URI:
     - For development: `http://localhost:3000/api/auth/callback/kakao`
     - For production: `https://yourdomain.com/api/auth/callback/kakao`

4. Configure consent items (동의항목):
   - Go to "Consent Items" (동의항목)
   - Enable the following permissions:
     - Profile Info (프로필 정보): Required
     - Email (카카오계정(이메일)): Optional (Business account required for "Required")
   
   **Note for Non-Business Accounts**: If you don't have a Kakao business account, you cannot make email a required field. The application has been updated to support Kakao users without email addresses. Users will be identified by their Kakao ID instead.

### 3. Update Environment Variables

Update your `.env.local` file with the credentials from Kakao:

```env
# Kakao OAuth
KAKAO_CLIENT_ID="your-rest-api-key"
KAKAO_CLIENT_SECRET="your-client-secret"
```

### 4. Important Security Notes

1. **Client Secret Generation**: 
   - In the Kakao Developers console, go to "Security" (보안)
   - Click "Generate Client Secret" (Client Secret 생성)
   - Toggle "Client Secret Code" to ON (활성화)
   - Copy the generated secret immediately (it won't be shown again)

2. **Production Considerations**:
   - Always use HTTPS in production
   - Keep your Client Secret secure and never commit it to version control
   - Regularly rotate your Client Secret

3. **Redirect URI Configuration**:
   - The redirect URI must match exactly with what's configured in NextAuth
   - Include both development and production URLs in your Kakao app settings

### 5. Testing

1. Ensure your environment variables are set correctly
2. Start the development server: `npm run dev`
3. Navigate to the login page
4. Click "카카오로 로그인" (Login with Kakao)
5. You should be redirected to Kakao's OAuth consent page
6. After authorization, you'll be redirected back to your application

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**:
   - Ensure the redirect URI in Kakao Developers matches exactly: `/api/auth/callback/kakao`
   - Check that your domain is registered in the platform settings

2. **"Client authentication failed" error**:
   - Verify your KAKAO_CLIENT_ID and KAKAO_CLIENT_SECRET are correct
   - Ensure Client Secret is activated in the Kakao Developers console

3. **"Access was denied" error after successful Kakao login**:
   - For older versions: This meant the user didn't share their email address
   - **Current version**: The app now supports Kakao users without email
   - If you still see this error, ensure you're using the latest code that makes email optional

4. **Login works locally but not in production**:
   - Add your production domain to the platform settings
   - Update redirect URIs to include your production URL
   - Ensure NEXTAUTH_URL is set correctly in production

### Debug Mode

To enable debug logging for NextAuth:

1. Set `debug: true` in your NextAuth configuration (already configured to false in production)
2. Check the console logs for detailed error messages

## Additional Resources

- [Kakao Login Documentation](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [NextAuth.js Kakao Provider](https://next-auth.js.org/providers/kakao)
- [NextAuth.js Debugging](https://next-auth.js.org/configuration/options#debug)
/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Open your grimoire — confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://nvklbrxoblsbjucfhver.supabase.co/storage/v1/object/public/email-assets/logo.png" alt={siteName} style={logo} />
        <Heading style={h1}>Welcome to your grimoire</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Confirm <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link> to start writing.
        </Text>
        <Button style={button} href={confirmationUrl}>Confirm email</Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this scroll.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', margin: 0, padding: 0 }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logo = { width: '56px', height: '56px', margin: '0 0 24px', borderRadius: '8px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#33251A', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#6B5847', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#802438', textDecoration: 'underline' }
const button = { backgroundColor: '#802438', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#802438', letterSpacing: '0.15em', margin: '0 0 30px' }
const footer = { fontSize: '12px', color: '#998877', margin: '32px 0 0', borderTop: '1px solid #EAE2D6', paddingTop: '20px' }

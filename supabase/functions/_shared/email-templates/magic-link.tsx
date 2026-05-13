/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your sign-in link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://nvklbrxoblsbjucfhver.supabase.co/storage/v1/object/public/email-assets/logo.png" alt={siteName} style={logo} />
        <Heading style={h1}>Your sign-in link</Heading>
        <Text style={text}>
          Tap below to step back into {siteName}. This link expires shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>Sign in</Button>
        <Text style={footer}>
          Didn't request this? You can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', margin: 0, padding: 0 }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logo = { width: '56px', height: '56px', margin: '0 0 24px', borderRadius: '8px' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#33251A', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#6B5847', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#C99A1F', textDecoration: 'underline' }
const button = { backgroundColor: '#C99A1F', color: '#33251A', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#C99A1F', letterSpacing: '0.15em', margin: '0 0 30px' }
const footer = { fontSize: '12px', color: '#998877', margin: '32px 0 0', borderTop: '1px solid #EAE2D6', paddingTop: '20px' }

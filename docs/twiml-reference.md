# TwiML Voice Reference for AI Call Assistant

**Official Twilio Documentation:** https://www.twilio.com/docs/voice/twiml

## Overview
TwiML (Twilio Markup Language) is XML that you return from your webhook endpoints to tell Twilio what to do with a call. Your webhook receives a POST request from Twilio and must respond with valid TwiML XML.

## Basic TwiML Structure
```xml
<Response>
  <!-- TwiML verbs go here -->
</Response>
```

## TwiML Verbs Used in This Project

### `<Say>`
Converts text to speech for the caller.

**Syntax:**
```xml
<Say voice="alice" language="en-GB">Text to speak</Say>
```

**Attributes:**
- `voice`: Voice to use (alice, man, woman, Polly.*)
- `language`: Language code (en-GB for British English)

**Example:**
```xml
<Response>
  <Say>Welcome to NuVance Labs. Who would you like to speak with?</Say>
</Response>
```

### `<Gather>`
Collects input from the caller (speech or keypad).

**Syntax:**
```xml
<Gather input="speech" action="/api/process-speech" timeout="5" speechTimeout="auto">
  <Say>Please tell me who you'd like to speak with.</Say>
</Gather>
```

**Key Attributes:**
- `input`: "speech", "dtmf", or "speech dtmf"
- `action`: URL to POST results to
- `timeout`: Seconds to wait for input (default: 5)
- `speechTimeout`: "auto" or number of seconds
- `language`: Speech recognition language
- `speechModel`: "default", "numbers_and_commands", "phone_call"

**Response Parameters:**
Twilio will POST to your `action` URL with:
- `SpeechResult`: Transcribed speech text
- `Digits`: DTMF digits pressed (if applicable)

### `<Dial>`
Connects the caller to another number.

**Syntax:**
```xml
<Dial timeout="30" callerId="+447427134999">+447123456789</Dial>
```

**Attributes:**
- `timeout`: Seconds to ring before giving up
- `callerId`: Number to display as caller ID
- `action`: URL for status callback
- `method`: HTTP method for callback (default: POST)

**Status Callbacks:**
Twilio POSTs dial results to your webhook:
- `DialCallStatus`: "completed", "busy", "no-answer", "failed", "canceled"
- `DialCallDuration`: Call duration in seconds

### `<Hangup>`
Ends the call immediately.

**Syntax:**
```xml
<Hangup/>
```

**Example with message:**
```xml
<Response>
  <Say>Thank you for calling. Goodbye.</Say>
  <Hangup/>
</Response>
```

### `<Record>`
Records the caller's voice.

**Syntax:**
```xml
<Record action="/api/call-status" timeout="30" maxLength="120" playBeep="true"/>
```

**Attributes:**
- `action`: URL to POST recording details
- `timeout`: Seconds of silence before stopping
- `maxLength`: Maximum recording length in seconds
- `playBeep`: Play beep before recording (true/false)

### `<Pause>`
Creates silence for specified duration.

**Syntax:**
```xml
<Pause length="2"/>
```

**Attributes:**
- `length`: Seconds to pause (default: 1)

### `<Redirect>`
Redirects call to another webhook URL.

**Syntax:**
```xml
<Redirect method="POST">/api/voice</Redirect>
```

## Common TwiML Patterns for Call Assistant

### Initial Greeting with Speech Collection
```xml
<Response>
  <Say>This call may be recorded and transcribed for service purposes.</Say>
  <Pause length="1"/>
  <Say>Welcome to NuVance Labs. Who would you like to speak with?</Say>
  <Gather input="speech" action="/api/process-speech" timeout="5" speechTimeout="auto"/>
</Response>
```

### Call Routing
```xml
<Response>
  <Say>Connecting you now.</Say>
  <Dial timeout="30">+447123456789</Dial>
</Response>
```

### Call Routing with Fallback
```xml
<Response>
  <Dial action="/api/call-status" timeout="20">+447123456789</Dial>
  <Say>Sorry, that person is unavailable. Please leave a message.</Say>
  <Record action="/api/call-status" timeout="30" maxLength="120"/>
</Response>
```

### Taking a Message
```xml
<Response>
  <Say>Please leave a brief message with your name and reason for calling after the beep.</Say>
  <Record action="/api/call-status" timeout="30" maxLength="120" playBeep="true"/>
</Response>
```

### Asking for Clarification
```xml
<Response>
  <Say>I didn't quite catch that. Could you please tell me if you're looking for Emma, Michael, or have a sales inquiry?</Say>
  <Gather input="speech" action="/api/process-speech" timeout="5" speechTimeout="auto"/>
</Response>
```

### Filtering Unwanted Calls
```xml
<Response>
  <Say>Thank you for calling NuVance Labs.</Say>
  <Hangup/>
</Response>
```

## Webhook Request Parameters

### Initial Call (`/api/voice`)
Twilio POSTs these parameters:
- `CallSid`: Unique call identifier
- `From`: Caller's phone number
- `To`: Your Twilio number
- `CallStatus`: "ringing", "in-progress", etc.

### Speech Processing (`/api/process-speech`)
- `CallSid`: Call identifier
- `SpeechResult`: Transcribed speech
- `From`: Caller's number
- `DialCallStatus`: If this follows a `<Dial>` attempt

### Call Status (`/api/call-status`)
- `CallSid`: Call identifier
- `CallStatus`: "completed", "busy", "no-answer", "failed"
- `CallDuration`: Total call time in seconds
- `RecordingUrl`: URL of recording (if any)

## Content-Type Headers
Always return TwiML with proper headers:
```
Content-Type: text/xml
```

## Error Handling
If your webhook fails, provide fallback TwiML:
```xml
<Response>
  <Say>Sorry, we are experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>
```

## UK Compliance
For UK operations, include recording notice:
```xml
<Say>This call may be recorded and transcribed for service purposes.</Say>
```

## Testing
Use Twilio Console's TwiML Bins to test TwiML responses before implementing in your webhook endpoints.
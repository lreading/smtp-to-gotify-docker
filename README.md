# SMTP to Gotify Docker
This is a simple docker container that forwards SMTP messages to Gotify.  I created this so that I could capture emails from applications and appliances that only know how to send emails, but still get notifications in gotify.  It's a lightweight server, and the only security considation is that it requires an API Key to authenticate.  Use at your own risk, keep this firewalled, etc.

# Environment Variables
| Variable | Description | Default |
| --- | --- | --- |
| `GOTIFY_URL` | The URL of your Gotify instance |  |
| `GOTIFY_TOKEN` | The token of your Gotify instance |  |
| `API_KEY` | The API key to use for SMTP authentication.  This ignores the username value, and only checks the key.  This is so that you can have multiple systems report to the same application in Gotify and differentiate them in the notifications.  You can use any value you want here, but your email clients will need to use that value as the password. |  |
| `BIND_IP` | The IP address to bind to | `0.0.0.0` |
| `PORT` | The port to bind to | `2525` |
| `TLS_KEY_PATH` | Optional. Path to a private key file used for STARTTLS. If set together with `TLS_CERT_PATH`, the server will advertise STARTTLS and use this key. |  |
| `TLS_CERT_PATH` | Optional. Path to a certificate file used for STARTTLS. The certificate should match the hostname clients use to connect. |  |

# Running
You can run this in many ways, but the point here was having a docker image.  I have this deployed in my kubernetes environment alongside my gotify instance. 

Here's how you can run it locally with docker:
```
docker run \
    -p 2525:2525 \
    -e GOTIFY_URL=https://gotify.example.com \
    -e GOTIFY_TOKEN=your-token \
    -e API_KEY=some-secret-you-control \
    imoshtokill/smtp-to-gotify-docker:latest
```

After it's running, you can test it by sending it a test email.  A simple way of testing this is via curl:
```bash
curl --url "smtp://127.0.0.1:2525" \
  --user "api_user:some-secret-you-control" \
  --mail-from "test@test.com" \
  --mail-rcpt "test@test.com" \
  --upload-file email.txt \ # where email.txt is a file with the email contents
  --insecure \
  --ssl-reqd
```


Another way of testing, if you have NodeJS installed, is by running the following in a new, empty directory:

```bash
npm init
npm i -S nodemailer
```

Then create a file called `index.js` with the following contents:

```javascript
const { createTransport } = require('nodemailer');

const transporter = createTransport({
    host: "127.0.0.1",
    port: 2525,
    auth: {
        type: 'OAuth2',
        user: 'api_user',
        accessToken: 'some-secret-you-control',
    },
    tls: {
        rejectUnauthorized: false
    }
});

const mailOptions = {
    from: 'sender@nowhere.com',
    to: 'receiver@nowhere.com',
    subject: `Your subject`,
    text: `Your text content`
};

transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});
```

Then run `node index.js` and you should see the email show up in your gotify instance.  If you don't, check the logs of the docker container to see what's going on.

# TLS and STARTTLS
This server supports STARTTLS when both `TLS_KEY_PATH` and `TLS_CERT_PATH` are set. The files are read from the container filesystem and passed to the SMTP server so that clients such as Alertmanager can require TLS and validate the certificate. In Kubernetes you can mount a cert manager managed secret into the container and point these variables at `/certs/tls.key` and `/certs/tls.crt`.

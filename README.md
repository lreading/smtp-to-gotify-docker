# SMTP to Gotify Docker
This is a simple docker container that forwards SMTP messages to Gotify.  I created this so that I could capture emails from applications and appliances that only know how to send emails, but still get notifications in gotify.  It's a lightweight server, and the only security considation is that it requires an API Key to authenticate.  Use at your own risk, keep this firewalled, etc.

# Environment Variables
| Variable | Description | Default |
| --- | --- | --- |
| `GOTIFY_URL` | The URL of your Gotify instance |  |
| `GOTIFY_TOKEN` | The token of your Gotify instance |  |
| `API_KEY` | The API key to use for SMTP authentication.  This ignores the username value, and only checks the key.  This is so that you can have multiple systems report to the same application in Gotify and differentiate them in the notifications |  |
| `BIND_IP` | The IP address to bind to | `0.0.0.0` |
| `PORT` | The port to bind to | `2525` |

# Running
You can run this in many ways, but the point here was having a docker image.  I have this deployed in my kubernetes environment alongside my gotify instance. 

Here's how you can run it locally with docker:
```
docker run \
    -p 2525:2525 \
    -e GOTIFY_URL=https://gotify.example.com \
    -e GOTIFY_TOKEN=your-token \
    -e API_KEY=some-secret-you-control \
    imoshtokill/smtp-to-gotify
```

After it's running, you can test it by sending it a test email.  If you have node installed, you can run the following in a new, empty directory:

```
npm init
npm i -S nodemailer
```

Then create a file called `index.js` with the following contents:

```
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

[![Continuous Integration](https://github.com/kaiosilveira/nodejs-timeouts/actions/workflows/ci.yml/badge.svg)](https://github.com/kaiosilveira/nodejs-timeouts/actions/workflows/ci.yml)

# Timeouts

Timeouts are a great way of avoiding slow responses and cascading failures, they help protecting our systems of hanging indefinitely while waiting for a response that might never come, and still they are constantly overlooked by libraries (which usually defaults their timeout configurations to zero, i.e., "no timeout") and by client code (because often developers using a library just don't bother checking the config and applying an adequate setup). This repo contains examples of configuring timeouts for different tools.

## Handcrafted timeout in NodeJS

Even when you're not using a third-party library to perform http requests, you can still easily set up a timeout configuration to use with your bare `xhr` tooling. This example implements a `ManagedHTTPClient` responsible for exposing http methods abstracted on top of your favorite `XHRClientWrapper` (I had a go with 'node:http', for instance). The class looks simple and straightforward and although it only contains the `get` request, the idea ids clear. Here how it looks like:

```javascript
export default class ManagedHTTPClient {
  http: XHRClientWrapper;
  timeoutMs: number;

  constructor({ http, timeoutMs }: { http: XHRClientWrapper; timeoutMs: number }) {
    this.http = http;
    this.timeoutMs = timeoutMs;
  }

  async get(url: string): Promise<unknown> {
    return await Promise.race([this.timeoutPromise(), this.http.get(url)]);
  }

  private async timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          `The requested operation timed out following the application's SLO of ${this.timeoutMs}.`
        );
      }, this.timeoutMs);
    });
  }
}
```

To forcefully interrupt a hanging request, we resorted to `Promise.race`, which receives as its argument an array of promises and executes all of them in parallel, aborting all the others as soon as the first result comes through. The trick here is that we're running our actual request (`this.http.get(url)`) in parallel with a dummy `timeoutPromise`, which does nothing but rejecting after the specified `timeoutMs`. It means that if the actual requests takes longer than our defined timeout for `ManagedHTTPClient` the promise returned by `ManagedHTTPClient.get` will reject using the timeout error message.

The working code for this example is available at [./src/handcrafted-example/](./src/handcrafted-example/).

## Timeouts in Mongoose

Mongoose is one of the most popular ways of integrating with MongoDB when using NodeJS and also a good example of well-specified timeouts by default. They use a default timeout of `30000` for for connection attempts and a timeout of 6 minutes (360000ms) for socket inactivity. They also provide a `heartbeatFrequencyMS` with keeps pinging the database server from time to time and close the connection of it fails. Here's an example of configuration for its various timeouts characteristics:

```javascript
const options = {
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  heartbeatFrequencyMS: 5000, // Will ping the server periodically in an interval of 5 to 5 seconds
  maxTimeMS: 30000, // The maxTimeMS setting specifies how long MongoDB should run an operation before cancelling it
};
mongoose.connect(uri, options);
```

For the official `mongoose` documentation on configuration options and timeouts, see [Mongoose's oficial docs](https://mongoosejs.com/docs/connections.html#options).

## Timeouts in Axios

Axios is one of the most popular libraries when it comes o performing HTTP requests. It's commonly seen both in the frontend and backend worlds. And it's an example of library that do not specifies a timeout by default. Hopefully, though, it's pretty simple and straightforward to do so when creating an Axios request:

```javascript
axios.get('/user?ID=12345', { timeout: 1000 });
```

It is also possible to configure the timeout (and other props) in the application level by creating an axios instance:

```javascript
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  headers: { 'X-Custom-Header': 'foobar' },
});
```

For the official documentation on configuration options and timeouts, see [Axios' oficial docs](https://axios-http.com/docs/req_config).

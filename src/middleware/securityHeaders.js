const helmet = require('helmet');

// Restrictive CSP for the API responses (and later the React frontend origin).
// Each directive limits where the browser may load that resource type from.
function createHelmetMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"], // fallback: same origin only
        scriptSrc: ["'self'"], // no inline/eval scripts
        styleSrc: ["'self'"], // no inline styles from CDNs
        imgSrc: ["'self'", 'data:'], // images from this app or data URIs
        connectSrc: ["'self'"], // XHR/fetch only to this origin
        fontSrc: ["'self'"], // no third-party fonts
        objectSrc: ["'none'"], // block plugins (Flash, etc.)
        frameSrc: ["'none'"], // no embedding other sites in frames
        frameAncestors: ["'none'"], // deny clickjacking via framing this app
        baseUri: ["'self'"], // restrict <base href>
        formAction: ["'self'"], // forms may only submit to this origin
        upgradeInsecureRequests: [], // prefer HTTPS for subresources
      },
    },
    // Helmet also sets X-Content-Type-Options, Referrer-Policy, etc. by default.
  });
}

module.exports = {
  createHelmetMiddleware,
};

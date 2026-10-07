// Strip HTML/markup so stored gig text is plain text only.
function sanitisePlainText(value) {
  return String(value)
    .replace(/<[^>]*>/g, '') // remove tags such as <script>, <img>, <b>
    .replace(/[<>]/g, '') // remove any leftover angle brackets
    .replace(/\0/g, '') // strip null bytes
    .trim();
}

// Reject clearly dangerous scripting patterns before storage.
function containsDangerousContent(value) {
  return /<\s*script|javascript:|on\w+\s*=/i.test(String(value));
}

module.exports = {
  sanitisePlainText,
  containsDangerousContent,
};

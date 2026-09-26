// Meta Pixel for animoplatform.net.
// Sends PageView on every page. The Calendly booking (Lead) and tracked CTA clicks (CTAClick)
// are sent from site.js. Automatic event detection is off, and no visitor or invitee details are sent.
(function () {
  var PIXEL_ID = "1118119757242116";
  if (!/^\d{12,20}$/.test(PIXEL_ID)) return; // not configured yet: do nothing

  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("set", "autoConfig", false, PIXEL_ID);
  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
})();

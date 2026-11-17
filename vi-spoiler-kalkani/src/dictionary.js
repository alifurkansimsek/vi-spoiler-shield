// Spoiler-safe dictionary: universe terms are stored in ROT13 so that opening this
// file does not reveal names. They are decoded only in memory by matcher.js.
// To add your own terms, use the extension's settings page instead of editing this.
(function (g) {
  g.G6S_DICT = {
    // Unique to the game: a single hit is enough to block.
    strong: [
      "wnfba qhiny", "yhpvn pnzvabf", "pny unzcgba", "obbovr vxr", "qer'dhna cevrfg", "qerdhna cevrfg",
      "erny qvzrm", "enhy onhgvfgn", "oevna urqre", "yrbavqn", "cbeg tryyubea", "tenffeviref",
      "zbhag xnyntn", "xnyntn angvbany", "onr-yhkr", "onr yhkr", "qjacyl", "bayl enj erpbeqf",
      "pbpbgrb sz", "ivagntr ivpr pvgl", "gur ivpr pvgl pbyyrpgvba"
    ],
    // Common words: blocked only together with another term or a context word nearby.
    weak: ["wnfba", "yhpvn", "ivpr pvgl", "nzoebfvn", "obbovr", "qer'dhna", "ebkl", "xnyntn"],
    // Sites dedicated to the game or series. Can be overridden from settings.
    domains: [
      "rockstargames.com", "rockstarintel.com", "gtaboom.com", "gtavice.net", "gtaforums.com",
      "igrandtheftauto.com", "wikigta.org", "gta.fandom.com", "grandtheftauto.fandom.com", "gta.wiki",
      "gta6.com", "gta6.net", "gtavi.com", "grand-theft-auto-vi-wiki.pages.dev", "rockstar-files.pages.dev",
      "media-rockstargames-com.akamaized.net"
    ],
    // Official trailer video IDs on YouTube.
    videoIds: ["QdBZY2fkU-0", "VQRLujxTm3c", "tJbzMqJGH4k", "_yl5ELcmugI", "rz1B4B2yBZY", "qq76pQsI1iw", "EiQEBYDox_k"]
  };
})(typeof self !== 'undefined' ? self : globalThis);

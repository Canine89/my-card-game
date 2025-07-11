const fs = require('fs');
const config = `\nwindow.SUPABASE_URL = '${process.env.SUPABASE_URL}';\nwindow.SUPABASE_ANON_KEY = '${process.env.SUPABASE_ANON_KEY}';\n`;
fs.writeFileSync('card_game_supabase/supabase-config.js', config); 